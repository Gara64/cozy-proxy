Client = require('request-json').JsonClient
americano = require 'americano-cozy'
async = require 'async'
logger = require('printit')
    date: false
    prefix: 'models:UserSharing'

module.exports = UserSharing = americano.getModel 'UserSharing',
    login: String
    password: String
    configuration: Object

cache = {}
# Initialize ds client : usefull to retrieve all accesses
dsHost = 'localhost'
dsPort = '9101'
client = new Client "http://#{dsHost}:#{dsPort}/"
if process.env.NODE_ENV is "production" or process.env.NODE_ENV is "test"
    client.setBasicAuth process.env.NAME, process.env.TOKEN

# Update UserSharing in cache
UserSharing.update = (callback) ->
    # Retrieve all UserSharings
    UserSharing.request 'all', (err, userSharings) ->
        cache = {}
        if err?
            logger.error err
            callback err
        else
            if userSharings?
                # Retrieve all accesses
                userSharings = userSharings.map (userSharing) ->
                    return userSharing.id
                client.post "request/access/byApp/", {}, (err, res, accesses) ->
                    if err?
                        logger.error err
                        callback err
                    else
                        for access in accesses
                            # Check if access correspond to a userSharing
                            if access.key in userSharings
                                cache[access.value.login] = access.value.token
                    callback() if callback?
            else
                callback() if callback?

# Check if userSharing <login>:<password> is authenticated
UserSharing.isAuthenticated = (login, password, callback) ->
    isPresent = cache[login]? and cache[login] is password
    if isPresent or process.env.NODE_ENV is "development"
        callback true
    else
        @update ->
            callback(cache[login]? and cache[login] is password)
