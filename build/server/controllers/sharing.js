// Generated by CoffeeScript 1.10.0
var getProxy;

getProxy = require('../lib/proxy').getProxy;

module.exports.request = function(req, res, next) {

  /*TODO: the incoming request should be in this form :
  (see owncloud)
  sender
  sharing id
  description
  options (synced, bilateral, master/p2P, etc)
  
  the receiver should generate a password for this sharing
   */
  var homePort, target;
  console.log('origin : ' + req.get('host'));
  console.log('forward : ' + req.headers["x-forwarded-for"]);
  console.log('remote address : ' + req.connection.remoteAddress);
  homePort = process.env.DEFAULT_REDIRECT_PORT;
  target = "http://localhost:" + homePort;
  return getProxy().web(req, res, {
    target: target
  });
};

module.exports.answer = function(req, res, next) {
  var dsHost, dsPort, ref, target;
  console.log('answer body : ' + JSON.stringify(req.body));
  if ((ref = req.params) != null ? ref.answer : void 0) {
    console.log('the answer is ' + req.body.answer);
  }
  dsHost = 'localhost';
  dsPort = '9101';
  target = "http://" + dsHost + ":" + dsPort + "/";
  return getProxy().web(req, res, {
    target: target
  });
};
