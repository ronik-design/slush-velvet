import test from 'ava';
import isPlainObj from 'is-plain-obj';
import server from '../server';

const HTTP_OK = 200;
const HTTP_ERROR = 400;
const HTTP_NOT_FOUND = 404;

test('root index responds', async t => {
  const request = {
    method: 'GET',
    url: '/'
  };

  server.inject(request, response => {
    t.true(isPlainObj(response));
    t.is(response.statusCode, HTTP_OK);
  });
});

test('404s are handled by an error page', async t => {
  const request = {
    method: 'GET',
    url: '/404'
  };

  server.inject(request, response => {
    t.true(isPlainObj(response));
    t.is(response.statusCode, HTTP_NOT_FOUND);
  });
});

test('other errors return errors', async t => {
  const request = {
    method: 'GET',
    url: '../../'
  };

  server.inject(request, response => {
    t.true(isPlainObj(response));
    t.is(response.statusCode, HTTP_ERROR);
  });
});
