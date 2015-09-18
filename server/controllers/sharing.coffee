{getProxy} = require '../lib/proxy'


module.exports.request = (req, res, next) ->

    ###TODO: the incoming request should be in this form :
    (see owncloud)
    sender
    sharing id
    description
    options (synced, bilateral, master/p2P, etc)

    the receiver should generate a password for this sharing
    ###
    console.log 'origin : ' + req.get 'host'
    console.log 'forward : ' + req.headers["x-forwarded-for"]
    console.log 'remote address : '  + req.connection.remoteAddress

    # Route the request the home
    homePort = process.env.DEFAULT_REDIRECT_PORT
    target = "http://localhost:#{homePort}"
    getProxy().web req, res, target: target

module.exports.answer = (req, res, next) ->
    console.log 'answer body : ' + JSON.stringify req.body
    console.log 'the answer is ' + req.body.answer if req.params?.answer
    #should be yes/no with the sharing id and a sharing password if yes

    # Route the answer to the DS
    dsHost = 'localhost'
    dsPort = '9101'
    target = "http://#{dsHost}:#{dsPort}/"
    getProxy().web req, res, target: target
