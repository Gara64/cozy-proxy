http = require('http')
should = require('chai').Should()
Client = require('request-json').JsonClient

helpers = require '../helpers'
{CozyProxy} = require '../proxy.coffee'
UserManager = require('../models').UserManager

client = new Client("http://localhost:4444/")
router = new CozyProxy()

describe "/routes", ->

    before ->
        router.start 4444
        router.routes["/apps/app1"] = 8001
        router.routes["/apps/app2"] = 8002
        router.routes["/apps/app3"] = 8003

    after ->
        router.stop()

    describe "GET /routes Return available routes.", ->

        it "When I request for routes", (done) ->
            client.get "routes/", (error, response, body) =>
                response.statusCode.should.equal 200
                @body = body
                done()

        it "Then I got 3 routes", ->
            nbRoutes = 0
            nbRoutes++ for route of @body
            nbRoutes.should.equal 3
        
describe "Proxying", ->

    before (done) ->

        router.start 4444
        router.routes["myapp"] = 4445
        @server = http.createServer (req, res) ->
            res.writeHead 200, 'Content-Type': 'application/json'
            res.end(JSON.stringify msg:"ok")
        @server.listen 4445, 'localhost'
        @userManager = new UserManager()

        @userManager.dbClient.put 'request/user/all/destroy/', {}, (err) =>
            password = helpers.cryptPassword('password').hash
            user =
                email: "test@cozycloud.cc"
                owner: true
                password: password
                activated: true

            @userManager.create user, (err, code, user) =>
                done()

    after ->
        router.stop()
        @server.close

    describe "Proxy success", ->
        it "When I send a request to an existing route", (done) ->
            client.post 'login', password: "password", =>
                client.get "apps/myapp/", (error, response, body) =>
                    response.statusCode.should.equal 200
                    @body = body
                    done()

        it "Then I got a response from target server", ->
            should.exist @body.msg
            @body.msg.should.equal "ok"