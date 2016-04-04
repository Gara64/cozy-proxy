Client = require('request-json').JsonClient
americano = require 'americano-cozy'
async = require 'async'
logger = require('printit')
    date: false
    prefix: 'models:Sharing'

Sharing = require '../models/sharing'
Device = require '../models/device'

# Keep in memory the logins/passwords
devices = {}
sharings = {}

# Initialize ds client : useful to retrieve all accesses
dsHost = 'localhost'
dsPort = '9101'
client = new Client "http://#{dsHost}:#{dsPort}/"
if process.env.NODE_ENV is "production" or process.env.NODE_ENV is "test"
    client.setBasicAuth process.env.NAME, process.env.TOKEN

# helper functions
extractCredentials = module.exports.extractCredentials = (header) ->
    if header?
        authDevice = header.replace 'Basic ', ''
        authDevice = new Buffer(authDevice, 'base64').toString 'utf8'
        # username should be 'owner'
        username = authDevice.substr(0, authDevice.indexOf(':'))
        password = authDevice.substr(authDevice.indexOf(':') + 1)
        return [username, password]
    else
        return ["", ""]

# Check if <login>:<password> is authenticated
module.exports.isDeviceAuthenticated = (header, callback) ->
    [login, password] = remote.extractCredentials header
    isPresent = devices[login]? and devices[login] is password
    if isPresent or process.env.NODE_ENV is "development"
        callback true
    else
        updateCredentials 'Device' ->
            callback(devices[login]? and devices[login] is password)


# Check if <login>:<password> is authenticated
module.exports.isSharingAuthenticated = (header, callback) ->
    [login, password] = remote.extractCredentials header
    isPresent = sharings[login]? and sharings[login] is password
    if isPresent or process.env.NODE_ENV is "development"
        callback true
    else
        updateCredentials 'Sharing' ->
            callback(sharings[login]? and sharings[login] is password)

    

# Update credentials in memory
updateCredentials = (model, callback) ->
    if model is 'Device'
        path = "request/device/all"
        cred = devices
    else if model is "Sharing"
        path = "request/sharing/all"
        cred = sharings

    # Retrieve all model's results
    client.post path, (err, results) ->
        cred = {}
        if err?
            logger.error err
            callback err
        else
            if results?
                # Retrieve all accesses
                results = results.map (result) ->
                    return result.id
                client.post "request/access/byApp/", {}, (err, res, accesses) ->
                    if err?
                        logger.error err
                        callback err
                    else
                        for access in accesses
                            # Check if access correspond to a Sharing
                            if access.key in sharings
                                cred[access.value.login] = access.value.token
                    callback() if callback?
            else
                callback() if callback?




