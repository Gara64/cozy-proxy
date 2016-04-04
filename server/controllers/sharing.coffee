Client = require('request-json').JsonClient

remoteAccess = require '../lib/remote_access'
request = require 'request-json'

{getProxy} = require '../lib/proxy'


couchdbHost = process.env.COUCH_HOST or 'localhost'
couchdbPort = process.env.COUCH_PORT or '5984'

dsHost = 'localhost'
dsPort = '9101'
clientDS = new Client "http://#{dsHost}:#{dsPort}/"

if process.env.NODE_ENV is "production" or process.env.NODE_ENV is "test"
    clientDS.setBasicAuth process.env.NAME, process.env.TOKEN




# Incoming sharing request
module.exports.request = (req, res, next) ->

    request = req.body
    console.log 'request : ' + JSON.stringify request

    # Check mandatory fields
    unless request.shareID? and request.desc? and request.hostUrl?
        err = new Error "Bad request"
        err.status = 400
        next err
    else
        # Create a Sharing doc and send it to the home
        createSharing request, (err, doc) ->
            return next err if err?

            homePort = process.env.DEFAULT_REDIRECT_PORT
            target = "http://localhost:#{homePort}"
            
            console.log 'lets ask the home'
            clientHome = new Client target
            clientHome.post req.url, id: doc._id, (err, result, body) ->
                if err?
                    next err
                else if not result?.statusCode?
                    err = new Error "Bad request"
                    err.status = 400
                    callback err
                else
                    res.send result.statusCode, body
        

# Incoming sharing revokation
module.exports.revoke = (req, res, next) ->
    request = req.body
    console.log 'request : ' + JSON.stringify request

    #TODO : check token
    #TODO : revoke a sharing access
    res.status 200, success: true

module.exports.answer = (req, res, next) ->
    #console.log 'answer : ' + JSON.stringify req.body

    #should be yes/no with the sharing id and a sharing password if yes

    # Route the answer to the DS
    dsHost = 'localhost'
    dsPort = '9101'
    target = "http://#{dsHost}:#{dsPort}/"
    getProxy().web req, res, target: target
    


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
