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

    homePort = process.env.DEFAULT_REDIRECT_PORT
    target = "http://localhost:#{homePort}"
    getProxy().web req, res, target: target

module.exports.answer = (req, res, next) ->
    console.log 'answer for a new sharing'
    console.log 'the answer is ' + req.params.answer if req.params?.answer
    res.send success: true, msg: 'answer received'
    #should be yes/no with the sharing id and a sharing password if yes
