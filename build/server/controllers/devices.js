// Generated by CoffeeScript 1.10.0
var Client, appManager, checkLogin, clientDS, couchdbHost, couchdbPort, createDevice, defaultPermissions, deviceExists, deviceManager, dsHost, dsPort, extractCredentials, getCredentialsHeader, getProxy, initAuth, passport, randomString, removeDevice, updateDevice;

Client = require('request-json').JsonClient;

passport = require('passport');

deviceManager = require('../models/device');

appManager = require('../lib/app_manager');

getProxy = require('../lib/proxy').getProxy;

couchdbHost = process.env.COUCH_HOST || 'localhost';

couchdbPort = process.env.COUCH_PORT || '5984';

dsHost = 'localhost';

dsPort = '9101';

clientDS = new Client("http://" + dsHost + ":" + dsPort + "/");

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  clientDS.setBasicAuth(process.env.NAME, process.env.TOKEN);
}

defaultPermissions = {
  'File': {
    'description': 'Usefull to synchronize your files'
  },
  'Folder': {
    'description': 'Usefull to synchronize your folder'
  },
  'Binary': {
    'description': 'Usefull to synchronize the content of your files'
  },
  'Notification': {
    'description': 'Usefull to synchronize cozy notifications'
  }
};

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

getCredentialsHeader = function() {
  var basicCredentials, credentials;
  credentials = process.env.NAME + ":" + process.env.TOKEN;
  basicCredentials = new Buffer(credentials).toString('base64');
  return "Basic " + basicCredentials;
};

deviceExists = function(login, cb) {
  return clientDS.post("request/device/byLogin/", {
    key: login
  }, function(err, result, body) {
    if (err) {
      return cb(err);
    } else if (body.length === 0) {
      return cb(null, false);
    } else {
      return cb(null, body[0]);
    }
  });
};

checkLogin = function(login, wantExist, cb) {
  var error;
  if (login == null) {
    error = new Error("Name isn't defined in req.body.login");
    error.status = 400;
    return cb(error);
  } else {
    return deviceExists(login, function(err, device) {
      if (err) {
        return next(err);
      } else if (device) {
        if (wantExist) {
          return cb(null, device);
        } else {
          error = new Error("This name is already used");
          error.status = 400;
          return cb(error);
        }
      } else {
        if (wantExist) {
          error = new Error("This device doesn't exist");
          error.status = 400;
          return cb(error);
        } else {
          return cb();
        }
      }
    });
  }
};

initAuth = function(req, cb) {
  var password, ref, user, username;
  ref = extractCredentials(req.headers['authorization']), username = ref[0], password = ref[1];
  user = {};
  user.body = {
    password: password
  };
  req.headers['authorization'] = void 0;
  return cb(user);
};

createDevice = function(device, cb) {
  device.docType = "Device";
  return clientDS.post("data/", device, function(err, result, docInfo) {
    var access;
    if (err != null) {
      return cb(err);
    }
    access = {
      login: device.login,
      password: randomString(32),
      app: docInfo._id,
      permissions: device.permissions || defaultPermissions
    };
    return clientDS.post('access/', access, function(err, result, body) {
      var data;
      if (err != null) {
        return cb(err);
      }
      data = {
        password: access.password,
        login: device.login,
        permissions: access.permissions
      };
      return cb(null, data);
    });
  });
};

updateDevice = function(oldDevice, device, cb) {
  var path;
  path = "request/access/byApp/";
  return clientDS.post(path, {
    key: oldDevice.id
  }, function(err, result, accesses) {
    var access;
    access = {
      login: device.login,
      password: randomString(32),
      app: oldDevice.id,
      permissions: device.permissions || defaultPermissions
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
          login: device.login,
          permissions: access.permissions
        };
        return cb(null, data);
      }
    });
  });
};

removeDevice = function(device, cb) {
  var id;
  id = device.id;
  return clientDS.del("access/" + id + "/", function(err, result, body) {
    var error;
    if (err != null) {
      error = new Error(err);
      error.status = 400;
      return cd(error);
    } else {
      return clientDS.del("data/" + id + "/", function(err, result, body) {
        if (err != null) {
          error = new Error(err);
          error.status = 400;
          return cd(error);
        } else {
          return cb(null);
        }
      });
    }
  });
};

module.exports.create = function(req, res, next) {
  var authenticator;
  authenticator = passport.authenticate('local', function(err, user) {
    var device, error;
    if (err) {
      console.log(err);
      return next(err);
    } else if (user === void 0 || !user) {
      error = new Error("Bad credentials");
      error.status = 401;
      return next(error);
    } else {
      device = req.body;
      return checkLogin(device.login, false, function(err) {
        if (err != null) {
          return next(err);
        }
        device.docType = "Device";
        return createDevice(device, function(err, data) {
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

module.exports.update = function(req, res, next) {
  var authenticator;
  authenticator = passport.authenticate('local', function(err, user) {
    var device, error, login;
    if (err) {
      console.log(err);
      return next(err);
    } else if (user === void 0 || !user) {
      error = new Error("Bad credentials");
      error.status = 401;
      return next(error);
    } else {
      login = req.params.login;
      device = req.body;
      return checkLogin(login, true, function(err, oldDevice) {
        if (err != null) {
          return next(err);
        }
        device.docType = "Device";
        return updateDevice(oldDevice, device, function(err, data) {
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

module.exports.remove = function(req, res, next) {
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
        if (err != null) {
          return next(err);
        }
        return removeDevice(device, function(err) {
          if (err != null) {
            return next(err);
          } else {
            return res.send(204);
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
  return deviceManager.isAuthenticated(username, password, function(auth) {
    var error;
    if (auth) {
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

module.exports.dsApi = function(req, res, next) {
  var password, ref, username;
  ref = extractCredentials(req.headers['authorization']), username = ref[0], password = ref[1];
  return deviceManager.isAuthenticated(username, password, function(auth) {
    var error;
    if (auth) {
      req.url = req.url.replace('ds-api/', '');
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

module.exports.getVersions = function(req, res, next) {
  var password, ref, username;
  ref = extractCredentials(req.headers['authorization']), username = ref[0], password = ref[1];
  return deviceManager.isAuthenticated(username, password, function(auth) {
    var error;
    if (auth) {
      return appManager.versions(function(err, apps) {
        var error;
        if (err != null) {
          error = new Error(err);
          error.status = 400;
          return next(error);
        } else {
          return res.send(apps, 200);
        }
      });
    } else {
      error = new Error("Request unauthorized");
      error.status = 401;
      return next(error);
    }
  });
};

module.exports.oldReplication = function(req, res, next) {
  var password, ref, username;
  ref = extractCredentials(req.headers['authorization']), username = ref[0], password = ref[1];
  return deviceManager.isAuthenticated(username, password, function(auth) {
    var error, target;
    if (auth) {
      if (process.env.NODE_ENV === "production") {
        req.headers['authorization'] = getCredentialsHeader();
      } else {
        req.headers['authorization'] = null;
      }
      target = "http://" + couchdbHost + ":" + couchdbPort;
      return getProxy().web(req, res, {
        target: target
      });
    } else {
      error = new Error("Request unauthorized");
      error.status = 401;
      return next(error);
    }
  });
};
