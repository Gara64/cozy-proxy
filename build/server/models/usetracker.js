// Generated by CoffeeScript 1.10.0
var UseTracker, americano;

americano = require('americano-cozy');

module.exports = UseTracker = americano.getModel('UseTracker', {
  app: String,
  dateStart: Date,
  dateEnd: Date,
  duration: Number
});
