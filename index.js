var context = require('request-context'),
  flatten = require('arr-flatten'),
  onFinished = require('on-finished');

module.exports = function(logger) {
  return function(req, res, next) {
    req.logger = logger;
    next();
  };
};

module.exports.include = function() {
  var included = flatten([].slice.call(arguments));

  return function(req, res, next) {
    if (included.length) {
      var values = {};

      included.forEach(function(key) {
        values[key] = req[key];
      });

      req.logger = req.logger.child(values, true);
    }

    next();
  };
};

module.exports.context = function() {
  var included = flatten([].slice.call(arguments));

  return function(req, res, next) {
    if (included.length) {
      var values = {};

      included.forEach(function(key) {
        values[key] = context.get(key);
      });

      req.logger = req.logger.child(values, true);
    }

    next();
  };
};

module.exports.response = function() {
  return function(req, res, next) {
    onFinished(res, function(err, r) {
      req.logger.info({res: res, req: req}, 'Response finished');
    });

    next();
  };
};

module.exports.error = function() {
  return function(err, req, res, next) {
    req.logger.error({err: err}, 'Error');
    next(err);
  };
};
