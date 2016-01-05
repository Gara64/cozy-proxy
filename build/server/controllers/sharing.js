// Generated by CoffeeScript 1.10.0
var Client, clientDS, couchdbHost, couchdbPort, createUserSharing, dsHost, dsPort, extractCredentials, getProxy, randomString, request, updateUser, userSharingManager;

Client = require('request-json').JsonClient;

userSharingManager = require('../models/usersharing');

request = require('request-json');

getProxy = require('../lib/proxy').getProxy;

couchdbHost = process.env.COUCH_HOST || 'localhost';

couchdbPort = process.env.COUCH_PORT || '5984';

dsHost = 'localhost';

dsPort = '9101';

clientDS = new Client("http://" + dsHost + ":" + dsPort + "/");

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  clientDS.setBasicAuth(process.env.NAME, process.env.TOKEN);
}

randomString = function(length) {
  var string;
  string = "";
  while (string.length < length) {
    string = string + Math.random().toString(36).substr(2);
  }
  return string.substr(0, length);
};

extractCredentials = function(header) {
  var authDevice, password, username;
  if (header != null) {
    authDevice = header.replace('Basic ', '');
    authDevice = new Buffer(authDevice, 'base64').toString('utf8');
    username = authDevice.substr(0, authDevice.indexOf(':'));
    password = authDevice.substr(authDevice.indexOf(':') + 1);
    return [username, password];
  } else {
    return ["", ""];
  }
};

module.exports.request = function(req, res, next) {
  var err, sharingRequest;
  sharingRequest = req.body;
  console.log('request : ' + JSON.stringify(sharingRequest));
  if (sharingRequest == null) {
    err = new Error("Bad request");
    err.status = 400;
    return next(err);
  } else {
    return createUserSharing(sharingRequest, function(err, doc) {
      var clientHome, homePort, target;
      if (err != null) {
        return next(err);
      }
      homePort = process.env.DEFAULT_REDIRECT_PORT;
      target = "http://localhost:" + homePort;
      clientHome = new Client(target);
      return clientHome.post(req.url, {
        id: doc._id
      }, function(err, result, body) {
        if (err != null) {
          return next(err);
        } else if ((result != null ? result.statusCode : void 0) == null) {
          err = new Error("Bad request");
          err.status = 400;
          return callback(err);
        } else {
          return res.send(result.statusCode, body);
        }
      });
    });
  }
};

module.exports.answer = function(req, res, next) {
  var target;
  console.log('answer : ' + JSON.stringify(req.body));
  dsHost = 'localhost';
  dsPort = '9101';
  target = "http://" + dsHost + ":" + dsPort + "/";
  return getProxy().web(req, res, {
    target: target
  });
};

createUserSharing = function(user, callback) {
  user.docType = "UserSharing";
  return clientDS.post("data/", user, function(err, result, docInfo) {
    return callback(err, docInfo);
  });
};

updateUser = function(oldUser, user, cb) {
  var path;
  path = "request/access/byApp/";
  return clientDS.post(path, {
    key: oldUser.id
  }, function(err, result, accesses) {
    var access;
    access = {
      login: user.login,
      password: randomString(32),
      app: oldUser.id,
      permissions: user.permissions || defaultPermissions
    };
    path = "access/" + accesses[0].id + "/";
    return clientDS.put(path, access, function(err, result, body) {
      var data, error;
      if (err != null) {
        console.log(err);
        error = new Error(err);
        return cb(error);
      } else {
        data = {
          password: access.password,
          login: user.login,
          permissions: access.permissions
        };
        return cb(null, data);
      }
    });
  });
};

module.exports.createUser = function(req, res, next) {
  var authenticator;
  authenticator = passport.authenticate('local', function(err, user) {
    var error;
    if (err) {
      console.log(err);
      return next(err);
    } else if (user === void 0 || !user) {
      error = new Error("Bad credentials");
      error.status = 401;
      return next(error);
    } else {
      user = req.body;
      return checkLogin(user.login, false, function(err) {
        if (err != null) {
          return next(err);
        }
        user.docType = "UserSharing";
        return createUser(user, function(err, data) {
          if (err != null) {
            return next(err);
          } else {
            return res.send(201, data);
          }
        });
      });
    }
  });
  return initAuth(req, function(user) {
    return authenticator(user, res);
  });
};

module.exports.updateUser = function(req, res, next) {
  var authenticator;
  authenticator = passport.authenticate('local', function(err, user) {
    var error, login;
    if (err) {
      console.log(err);
      return next(err);
    } else if (user === void 0 || !user) {
      error = new Error("Bad credentials");
      error.status = 401;
      return next(error);
    } else {
      login = req.params.login;
      user = req.body;
      return checkLogin(login, true, function(err, oldDevice) {
        if (err != null) {
          return next(err);
        }
        user.docType = "UserSharing";
        return updateUser(oldUser, user, function(err, data) {
          if (err != null) {
            return next(err);
          } else {
            return res.send(200, data);
          }
        });
      });
    }
  });
  return initAuth(req, function(user) {
    return authenticator(user, res);
  });
};

module.exports.removeUser = function(req, res, next) {
  var authenticator;
  authenticator = passport.authenticate('local', function(err, user) {
    var error, login;
    if (err) {
      console.log(err);
      return next(err);
    } else if (user === void 0 || !user) {
      error = new Error("Bad credentials");
      error.status = 401;
      return next(error);
    } else {
      login = req.params.login;
      return checkLogin(login, true, function(err, device) {
        return removeUser(user, function(err) {
          if (err != null) {
            return next(err);
          } else {
            return res.send(200);
          }
        });
      });
    }
  });
  return initAuth(req, function(user) {
    return authenticator(user, res);
  });
};

module.exports.replication = function(req, res, next) {
  var password, ref, username;
  ref = extractCredentials(req.headers['authorization']), username = ref[0], password = ref[1];
  return userSharingManager.isAuthenticated(username, password, function(auth) {
    var error;
    if (auth) {
      req.url = req.url.replace('sharing/', '');
      return getProxy().web(req, res, {
        target: "http://" + dsHost + ":" + dsPort
      });
    } else {
      error = new Error("Request unauthorized");
      error.status = 401;
      return next(error);
    }
  });
};
