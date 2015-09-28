var assert = require('assert'),
  express = require('express'),
  supertest = require('supertest-as-promised'),
  sinon = require('sinon'),
  logging = require('../');

var server,
  info = sinon.spy(),
  error = sinon.spy(),
  child = sinon.spy(function() {
    return {
      child: child,
      info: info,
      error: error
    };
  });

beforeEach(function() {
  server = express();
  server.use(logging({
    child: child,
    info: info,
    error: error
  }));
});

it('logs response', function() {
  server.use(logging.response());
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
  server.use(logging.error());
  server.use(function(err, req, res, next) {
    next();
  });

  return supertest(server)
    .get('')
    .then(function() {
      assert.equal(error.called, true);
    });
});

it('can be extended', function() {
  server.use(function(req, res, next) {
    req.foo = 'foo';
    next();
  });
  server.use(logging.include('foo'));
  server.use(logging.response());
  server.get('', function(req, res) {
    res.status(200).send();
  });

  return supertest(server)
    .get('')
    .then(function() {
      assert.equal(child.called, true);
      assert.equal(info.called, true);
    });
});
