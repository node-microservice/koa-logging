var assert = require('assert'),
  bunyan = require('bunyan'),
  express = require('express'),
  supertest = require('supertest-as-promised'),
  sinon = require('sinon'),
  logging = require('../');

var server,
  log,
  info,
  error,
  child;

beforeEach(function() {
  server = express();

  var logger = bunyan.createLogger({
    name: 'test',
    serializers: bunyan.stdSerializers
  });

  info = sinon.spy(logger, 'info'),
  error = sinon.spy(logger, 'error'),
  child = sinon.spy(logger, 'child');

  log = logging(logger);
});

it('logs response', function() {
  server.use(log.responses());
  server.get('', function(req, res) {
    res.status(200).send();
  });

  return supertest(server)
    .get('')
    .then(function() {
      assert.equal(info.called, true);
    });
});

it('logs error', function() {
  server.get('', function(req, res, next) {
    next(new Error());
  });
  server.use(log.errors());
  server.use(function(err, req, res, next) {
    res.status(500).end();
  });

  return supertest(server)
    .get('')
    .expect(500)
    .then(function() {
      assert.equal(error.called, true);
    });
});

it('can be extended', function() {
  server.use(function(req, res, next) {
    req.foo = 'foo';
    next();
  });
  server.use(log.include('foo'));
  server.use(log.responses());
  server.get('', function(req, res) {
    res.status(200).send();
  });

  return supertest(server)
    .get('')
    .expect(200)
    .then(function() {
      assert.equal(child.called, true);
    });
});
