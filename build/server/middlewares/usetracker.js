// Generated by CoffeeScript 1.10.0

/*
App usage tracking
 */
var TIMING, UseTracker, appTracker;

appTracker = {};

if ((process.env.NODE_ENV == null) || process.env.NODE_ENV === "development") {
  TIMING = 10000;
} else {
  TIMING = 5 * 60 * 1000;
}

UseTracker = require('../models/usetracker');

module.exports = function(req, res, next) {
  var appInfo, appName, arrayUrl, date, url;
  url = req.url;
  if (url.indexOf("/apps") === 0) {
    arrayUrl = url.split('/');
    appName = arrayUrl[2];
    date = new Date();
    if (appTracker[appName] == null) {
      appTracker[appName] = {
        timer: date.getTime(),
        timeout: null
      };
    }
    appInfo = appTracker[appName];
    clearTimeout(appInfo.timeout);
    appInfo.timeout = setTimeout(function() {
      var data, dateEnd, dateStart;
      dateStart = appInfo.timer;
      dateEnd = new Date().getTime();
      data = {
        app: appName,
        dateStart: new Date(dateStart),
        dateEnd: new Date(dateEnd),
        duration: dateEnd - dateStart
      };
      delete appTracker[appName];
      return UseTracker.create(data, function(err, res, body) {
        if (err != null) {
          return console.log("Couldn't add app tracking info -- " + err);
        }
      });
    }, TIMING);
  }
  return next();
};
