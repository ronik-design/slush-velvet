'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');
const gulp = require('gulp');
const util = require('gulp-util');
const browserSync = require('browser-sync');

const DEFAULT_PORT = 4000;

const middleware = function (buildDir) {
  return function (req, res, next) {
    const requestPath = url.parse(req.url);
    const fileName = requestPath.href.split(requestPath.search).join('');
    const fileExists = fs.existsSync(path.join(buildDir, fileName));
    if (!fileExists && fileName.indexOf('browser-sync-client') < 0) {
      req.url = '/index.html';
    }
    return next();
  };
};

gulp.task('browser-sync', () => {
  const config = util.env.velvet.getGlobal('site').config;
  const buildDir = config['build_dir'];

  const host = util.env.host || 'localhost';
  const port = util.env.port || DEFAULT_PORT;
  const spa = util.env.spa;

  const server = {
    baseDir: buildDir
  };

  if (spa) {
    server.middleware = middleware(buildDir);
  }

  browserSync({
    open: false,
    ghostMode: false,
    host,
    port,
    server,
    reloadDebounce: 2000,
    files: [{
      match: path.join(buildDir, '**/*.+(js|html|css)'),
      options: {
        ignoreInitial: true,
        awaitWriteFinish: true
      }
    }]
  });

  util.env.reload = browserSync.reload;

  // watch(path.join(buildDir, '**/*.+(js|html|css)'), () => {
  //   browserSync.reload();
  // });
});
