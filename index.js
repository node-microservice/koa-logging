var flatten = require('arr-flatten'),
  ensureMap = require('ensure-map'),
  onFinished = require('on-finished');

module.exports = function(logger) {
  return function *(next) {
    var ctx = this;

    ctx.log = logger;

    onFinished(ctx.res, function() {
      ctx.log.debug({ res: ctx.res, req: ctx.req }, 'Response finished');
    });

    try {
      yield* next;
    } catch (err) {
      ctx.log.error({ err: err }, 'Error');
      throw err;
    }
  };
};

module.exports.include = function() {
  var included = flatten([].slice.call(arguments));
  var map = ensureMap(included);

  return function *(next) {
    var ctx = this;

    if (typeof ctx.log === 'undefined') {
      throw new Error('.use(logging(logger)) first');
    }

    if (included.length) {
      var values = {};

      included.forEach(function(key) {
        var alias = map[key];
        values[alias] = ctx[key];
      });

      ctx.log = ctx.log.child(values, true);
    }
    yield* next;
  };
};
