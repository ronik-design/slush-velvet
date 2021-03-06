'use strict';

// const YEAR_MS = 31536000000;

const path = require('path');
const loadConfig = require('./utils/load-config');

const config = loadConfig(process.env.CONFIG || 'site/_config.yml');
const HOST = process.env.HOST || config.host || '0.0.0.0';
const PORT = process.env.PORT || config.port || 4000;
const SERVE_DIR = process.env.NODE_ENV === 'production' ? config.destination : config.build;
const ERROR_PAGE = config.error || 'error.html';

const hapi = require('hapi');
const inert = require('inert');
const good = require('good');

const server = new hapi.Server();

server.connection({
  host: HOST,
  port: PORT
});

server.register(inert, () => {});

const options = {
  ops: {
    interval: 1000
  },
  reporters: {
    console: [
      {
        module: 'good-squeeze',
        name: 'Squeeze',
        args: [{log: '*', response: '*'}]
      },
      {
        module: 'good-console'
      },
      'stdout'
    ]
  }
};

server.register({register: good, options}, () => {});

server.route([{
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: SERVE_DIR,
      redirectToSlash: true,
      index: true
    }
  }
  // config: {
  //   cache: {
  //     expiresIn: 1 * YEAR_MS
  //   }
  // }
}]);

server.ext('onPostHandler', (request, reply) => {
  const response = request.response;
  if (response.isBoom && response.output.statusCode === 404) {
    return reply.file(path.join(SERVE_DIR, ERROR_PAGE)).code(404);
  }
  return reply.continue();
});

server.start(() => {
  console.info('Listening at: http://%s:%d', HOST, PORT);
});

module.exports = server;
