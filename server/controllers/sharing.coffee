{getProxy} = require '../lib/proxy'
userSharingManager = require '../models/usersharing'
request = require 'request-json'

# helper functions
extractCredentials = (header) ->
    if header?
        authDevice = header.replace 'Basic ', ''
        authDevice = new Buffer(authDevice, 'base64').toString 'utf8'
        # username should be 'owner'
        username = authDevice.substr(0, authDevice.indexOf(':'))
        password = authDevice.substr(authDevice.indexOf(':') + 1)
        return [username, password]
    else
        return ["", ""]

module.exports.request = (req, res, next) ->
    # NOTE : do not route the notification for tests and
    # suppose the answer is always yes
    # Route the request to the home
    ###homePort = process.env.DEFAULT_REDIRECT_PORT
    target = "http://localhost:#{homePort}"
    getProxy().web req, res, target: target
    ###

    sharingRequest = req.body.request
    console.log 'request : ' + JSON.stringify sharingRequest

    createUser sharingRequest, (err, data) ->
        data.accepted = yes
        request.newClient user.url
        request.post "sharing/answer", answer: data, (err, res, body) ->
            console.log 'body : ' + JSON.stringify body
            error = err if err? and Object.keys(err).length > 0
            next err


module.exports.answer = (req, res, next) ->
    console.log 'answer body : ' + JSON.stringify req.body
    #should be yes/no with the sharing id and a sharing password if yes

    # Route the answer to the DS
    dsHost = 'localhost'
    dsPort = '9101'
    target = "http://#{dsHost}:#{dsPort}/"
    getProxy().web req, res, target: target


# Create user :
#       * create user document
#       * create user access
createUser = (user, cb) ->
    user.docType = "UserSharing"
    # Create user document
    clientDS.post "data/", user, (err, result, docInfo) ->
        return cb(err) if err?

        # Create access for this device
        # Here the permissions must correspond to the docids
        access =
            login: user.shareID
            password: randomString 32
            app: docInfo._id
            permissions: user.docIDs
        clientDS.post 'access/', access, (err, result, body) ->
            return cb(err) if err?
            data =
                password: access.password
                login: user.shareID
                permissions: access.permissions
            # Return access to user
            cb null, data


# Update user :
#       * update user access
updateUser = (oldUser, user, cb) ->
    path = "request/access/byApp/"
    clientDS.post path, key: oldUser.id, (err, result, accesses) ->
        # Update access for this device
        access =
            login: user.login
            password: randomString 32
            app: oldUser.id
            permissions: user.permissions or defaultPermissions
        path = "access/#{accesses[0].id}/"
        clientDS.put path, access, (err, result, body) ->
            if err?
                console.log err
                error = new Error err
                cb error
            else
                data =
                    password: access.password
                    login: user.login
                    permissions: access.permissions
                # Return access to device
                cb null, data

module.exports.createUser = (req, res, next) ->

    # Check if user is authenticated
    authenticator = passport.authenticate 'local', (err, user) ->
        if err
            console.log err
            next err
        else if user is undefined or not user
            error = new Error "Bad credentials"
            error.status = 401
            next error
        else
            # Check if name is correctly declared and device doesn't exist
            user = req.body
            checkLogin user.login, false, (err) ->
                return next err if err?
                # Create device
                user.docType = "UserSharing"
                createUser user, (err, data) ->
                    if err?
                        next err
                    else
                        res.send 201, data


    initAuth req, (user) ->
        # Check if request is authenticated
        authenticator user, res


module.exports.updateUser = (req, res, next) ->

    authenticator = passport.authenticate 'local', (err, user) ->
        if err
            console.log err
            next err
        else if user is undefined or not user
            error = new Error "Bad credentials"
            error.status = 401
            next error
        else
            # Check if name is correctly declared and device exists
            login = req.params.login
            user = req.body
            checkLogin login, true, (err, oldDevice) ->
                return next err if err?
                # Update device
                user.docType = "UserSharing"
                updateUser oldUser, user, (err, data) ->
                    if err?
                        next err
                    else
                        res.send 200, data

    initAuth req, (user) ->
        # Check if request is authenticated
        authenticator user, res


module.exports.removeUser = (req, res, next) ->

    authenticator = passport.authenticate 'local', (err, user) ->
        if err
            console.log err
            next err
        else if user is undefined or not user
            error = new Error "Bad credentials"
            error.status = 401
            next error
        else
            # Send request to the Data System
            login = req.params.login

            checkLogin login, true, (err, device) ->
                # Remove device
                removeUser user, (err) ->
                    if err?
                        next err
                    else
                        res.send 200

    initAuth req, (user) ->
        # Check if request is authenticated
        authenticator user, res

module.exports.replication = (req, res, next) ->
    # Authenticate the request
    [username, password] = extractCredentials req.headers['authorization']
    userSharingManager.isAuthenticated username, password, (auth) ->
        if auth
            # Forward request for DS.
            getProxy().web req, res, target: "http://#{dsHost}:#{dsPort}"
        else
            error = new Error "Request unauthorized"
            error.status = 401
            next error
