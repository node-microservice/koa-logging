var context = require('request-context'),
  flatten = require('arr-flatten'),
  ensureMap = require('ensure-map'),
  onFinished = require('on-finished');

function includeInLogger(logger, picker) {
  return function() {
    var included = flatten([].slice.call(arguments));
    var map = ensureMap(included);

    return function(req, res, next) {
      req.logger = req.logger || logger;

      if (included.length) {
        var values = {};

        included.forEach(function(key) {
          var alias = map[key];
          values[alias] = picker(req, key);
        });

        req.logger = req.logger.child(values, true);
      }

      next();
    };
  };
}

module.exports = function(logger) {
  process.on('uncaughtException', function(err) {
    try {
      logger.fatal({err: err}, 'Uncaught Exception');
    } catch (error) {
      console.error(error);
    }
  });

  return {
    include: includeInLogger(logger, function(req, key) {
      return req[key];
    }),
    context: includeInLogger(logger, function(req, key) {
      return context.get(key);
    }),
    responses: function() {
      return function(req, res, next) {
        req.logger = req.logger || logger;

        onFinished(res, function(err) {
          if (err) {
            req.logger.error({err: err}, 'Error');
          }

          req.logger.info({res: res, req: req}, 'Response finished');
        });

        next();
      };
    },
    errors: function() {
      return function(err, req, res, next) {
        req.logger = req.logger || logger;
        req.logger.error({err: err}, 'Error');
        next(err);
      };
    }
  };
};
