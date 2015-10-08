'use strict';
/* global it, beforeEach */
const assert = require('assert'),
  bunyan = require('bunyan'),
  koa = require('koa'),
  supertest = require('supertest-as-promised'),
  sinon = require('sinon'),
  logging = require('../');

let server,
  log,
  debug,
  error,
  child;

beforeEach(function() {
  server = koa();

  var logger = bunyan.createLogger({
    name: 'test',
    serializers: bunyan.stdSerializers
  });

  debug = sinon.spy(logger, 'debug');
  error = sinon.spy(logger, 'error');
  child = sinon.spy(logger, 'child');

  log = logging(logger);
});

it('logs response', function() {
  server.use(log);
  server.use(function* () {
    this.status = 200;
  });

  return supertest(server.callback())
    .get('')
    .then(function() {
      assert.equal(debug.called, true);
    });
});

it('logs error', function() {
  server.use(log);
  server.use(function* () {
    throw new Error();
  });

  return supertest(server.callback())
    .get('')
    .expect(500)
    .then(function() {
      assert.equal(error.called, true);
    });
});

it('can be extended', function() {
  server.use(log);
  server.use(function* (next) {
    this.foo = 'foo';
    yield* next;
  });
  server.use(logging.include('foo'));
  server.use(function* () {
    this.status = 201;
  });

  return supertest(server.callback())
    .get('')
    .expect(201)
    .then(function() {
      assert.equal(child.called, true);
    });
});
