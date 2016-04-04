// Generated by CoffeeScript 1.10.0
var Client, UserSharing, americano, async, cache, client, dsHost, dsPort, logger,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Client = require('request-json').JsonClient;

americano = require('americano-cozy');

async = require('async');

logger = require('printit')({
  date: false,
  prefix: 'models:UserSharing'
});

module.exports = UserSharing = americano.getModel('UserSharing', {
  login: String,
  password: String,
  configuration: Object
});

cache = {};

dsHost = 'localhost';

dsPort = '9101';

client = new Client("http://" + dsHost + ":" + dsPort + "/");

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  client.setBasicAuth(process.env.NAME, process.env.TOKEN);
}

UserSharing.update = function(callback) {
  return UserSharing.request('all', function(err, userSharings) {
    cache = {};
    if (err != null) {
      logger.error(err);
      return callback(err);
    } else {
      if (userSharings != null) {
        userSharings = userSharings.map(function(userSharing) {
          return userSharing.id;
        });
        return client.post("request/access/byApp/", {}, function(err, res, accesses) {
          var access, i, len, ref;
          if (err != null) {
            logger.error(err);
            callback(err);
          } else {
            for (i = 0, len = accesses.length; i < len; i++) {
              access = accesses[i];
              if (ref = access.key, indexOf.call(userSharings, ref) >= 0) {
                cache[access.value.login] = access.value.token;
              }
            }
          }
          if (callback != null) {
            return callback();
          }
        });
      } else {
        if (callback != null) {
          return callback();
        }
      }
    }
  });
};

UserSharing.isAuthenticated = function(login, password, callback) {
  var isPresent;
  isPresent = (cache[login] != null) && cache[login] === password;
  if (isPresent || process.env.NODE_ENV === "development") {
    return callback(true);
  } else {
    return this.update(function() {
      return callback((cache[login] != null) && cache[login] === password);
    });
  }
};
