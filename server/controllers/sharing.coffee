Client = require('request-json').JsonClient

remoteAccess = require '../lib/remote_access'
request = require 'request-json'
RateLimiter = require('limiter').RateLimiter
{getProxy} = require '../lib/proxy'

dsHost = 'localhost'
dsPort = '9101'
clientDS = new Client "http://#{dsHost}:#{dsPort}/"

if process.env.NODE_ENV is "production" or process.env.NODE_ENV is "test"
    clientDS.setBasicAuth process.env.NAME, process.env.TOKEN

homeHost = 'localhost'
homePort = process.env.DEFAULT_REDIRECT_PORT
clientHome = new Client "http://#{homeHost}:#{homePort}/"

#Allow 200 sharing requests max per day
limiter = new RateLimiter 200, 'day', true


# Create sharing document
# Note this do not create access yet, as the user has to validate the sharing
createSharing = (sharing, callback) ->
    sharing.docType = "Sharing"
    clientDS.post "data/", sharing, (err, result, docInfo) ->
        callback err, docInfo


# The revocation request has been emitted from the sharer
# Remove the access and sharing documents
revokeFromSharer = (shareID, callback) ->
    path = "request/sharing/byShareID"
    # Get the sharing doc based on the shareID
    clientDS.post path, key: shareID, (err, result, body) ->
        if err? or body.length isnt 1
            callback err
        else
            id = body[0]?.id
            # Remove Access
            clientDS.del "access/#{id}/", (err, result, body) ->
                if err?
                    callback err
                else
                    # Remove Sharing
                    clientDS.del "data/#{id}/", (err, result, body) ->
                        if err?
                            callback err
                        else
                            callback null, id


# The revocation request has been emitted from a recipient
# Remove the recipient from the target list
revokeFromRecipient = (doc, target, callback) ->

    # Get the target position
    i = doc.targets.map((t) -> t.recipientUrl).indexOf target.recipientUrl

    if i < 0
        err = new Error "#{target.recipientUrl} not found for this sharing"
        err.status = 404
        callback err
    else
        # Remove the target
        doc.targets.splice i, 1

        # Update in db
        clientDS.put "data/#{doc._id}", doc, (err, result, body) ->
            callback err


# Controls the request rate
# This is done to prevent any excessive sharing requests
module.exports.rateLimiter = (req, res, next) ->
    # Decrease the request counter and check the value
    limiter.removeTokens 1, (err, tokens) ->
        if tokens < 0
            err = new Error "Too many requests. Please try later"
            err.status = 429
            next err
        else
            next()


# New sharing request emitted from a sharer
# This triggers the creation of a sharing document and a notification
# sent to the user.
# The sharing request must has this structure :
#  request  {
#     shareID         -> unique identifier for the sharing
#     sharerUrl       -> url of the sharer
#     recipientUrl    -> url of the recipient (prevent any domain mismatch)
#     rules[]         ->  a set of rules describing which documents will
#                         be shared, providing their id and their docType
#      desc           ->  a human-readable description of what is shared
# }
module.exports.request = (req, res, next) ->

    request = req.body

    # Check mandatory fields
    unless request.shareID? and request.sharerUrl? and
    request.recipientUrl? and request.rules? and request.desc?
        err = new Error "Bad request"
        err.status = 400
        return next err

    # Create a Sharing doc and send a notification
    createSharing request, (err, doc) ->
        if err?
            error = new Error "The sharing cannot be created"
            error.status = 400
            next error
        else
            clientHome.post req.url, id: doc._id, (err, result, body) ->
                if err? or res.statusCode / 100 isnt 2
                    error = new Error "The target has not been notified"
                    error.status = 400
                    next error
                else
                    res.status(200).send success: true


# Revoke an existing sharing and notify the user
# The revocation request must be authenticated and has this structure :
# revoke {
#  shareID      -> unique identifier for the sharing
#  desc          > [optionnal] a revocation message
# }
module.exports.revoke = (req, res, next) ->
    revoke = req.body

    # Check mandatory fields
    unless revoke.shareID?
        err = new Error "Bad request"
        err.status = 400
        return next err

    # Authenticate the request
    remoteAccess.isSharingAuthenticated req.headers['authorization'], (auth) ->
        if auth
            # Revoke the sharer
            revokeFromSharer revoke.shareID, (err, id) ->
                return next err if err?

                # The access has been revoked, send success
                res.status(200).send success: true

                # Send notification to the user
                notif =
                    id: id
                    shareID: revoke.shareID
                    desc: revoke.desc

                url = req.url.replace "sharing", "sharing/revoke"
                clientHome.post url, notif, (err, result, body) ->
                    return next err if err?

        else
            error = new Error "Request unauthorized"
            error.status = 401
            next error


# Revoke a target for an existing sharing and notify the user
# The revocation request must be authenticated and has this structure :
# revoke {
#  shareID      -> unique identifier for the sharing
#  token        -> token used to authenticate the recipient
#  desc          > [optionnal] a revocation message
# }
module.exports.revokeTarget = (req, res, next) ->
    revoke = req.body

    # Check mandatory fields
    unless revoke.shareID?
        err = new Error "Bad request"
        err.status = 400
        return next err

    credential =
        shareID: revoke.shareID
        token: revoke.token

    # Authenticate the request and get the target from its credentials
    remoteAccess.isTargetAuthenticated credential, (auth, doc, target) ->
        if auth
            revokeFromRecipient doc, target, (err) ->
                if err?
                    error = new Error "Cannot revoke the recipient"
                    error.status = 400
                    next error
                else
                    # The recipient has been revoked, send success
                    res.status(200).send success: true

                    # Send notification to the user
                    notif =
                        shareID: revoke.shareID
                        desc: revoke.desc
                        recipientUrl: target.recipientUrl

                    url = req.url.replace "target", "revokeTarget"
                    clientHome.post url, notif, (err, result, body) ->
                        return next err if err?

        else
            error = new Error "Request unauthorized"
            error.status = 401
            next error


# Answer sent by a sharing recipient after a sharing request
# Route the answer to the DS and notify the user
# The DS will authenticate the request thanks to the mandatory pre_token.
# The answer request must has this structure :
# answer {
#   shareID      -> unique identifier for the sharing
#   recipientUrl -> the recipient's url
#   accepted     -> boolean specifying if the share was accepted or not
#   preToken     -> token used to authenticate the recipient
#   token        -> [conditionnal] the token generated by the target,
#                   if it has accepted the sharing
# }
module.exports.answer = (req, res, next) ->
    answer = req.body

    # Check mandatory fields
    unless answer.shareID? and answer.recipientUrl? and answer.accepted? and
    answer.preToken?
        err = new Error "Bad request"
        err.status = 400
        return next err

    credential =
        shareID: answer.shareID
        token: answer.preToken

    # Authenticate the request
    remoteAccess.isTargetAuthenticated credential, (auth) ->

        clientDS.post req.url, req.body, (err, result, body) ->
            return next err if err?

            # The answer has been treated, send success
            res.status(200).send success: true

            # Notify the user
            clientHome.post req.url, req.body, (err, result, body) ->
                return next err if err?


# Forward the replication to the DS if the request is authenticated
module.exports.replication = (req, res, next) ->
    # Authenticate the request
    remoteAccess.isSharingAuthenticated req.headers['authorization'], (auth) ->
        if auth
            # Forward request for DS.
            req.url = req.url.replace 'services/sharing/', ''
            getProxy().web req, res, target: "http://#{dsHost}:#{dsPort}"
        else
            error = new Error "Request unauthorized"
            error.status = 401
            next error

