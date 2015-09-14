{getProxy} = require '../lib/proxy'


module.exports.request = (req, res, next) ->
    console.log 'request for a new sharing'
    console.log 'req : ' + req.baseUrl

    ###TODO: the incoming request should be in this form :
    (see owncloud)
    sender
    sharing id
    description
    options (synced, bilateral, master/p2P, etc)

    the receiver should generate a password for this sharing
    ###

    homePort = process.env.DEFAULT_REDIRECT_PORT
    target = "http://localhost:#{homePort}/sharing/request"
    getProxy().web req, res, target: target

module.exports.answer = (req, res, next) ->
    console.log 'answer for a new sharing'
    #should be yes/no with the sharing id and a sharing password if yes
