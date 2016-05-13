'use strict';

const HELP = `

---- S T E N C I L ----

Usage: gulp [task] [options]

gulp develop [--host, --port]
gulp build [--production]
gulp deploy [--production, --target=[staging,production]]

`;

const gulp = require('gulp');
const gutil = require('gulp-util');
const runSequence = require('run-sequence');
const requireDir = require('require-dir');
const velvet = require('velvet');
const loadConfig = require('./utils/load-config');

// Config

gutil.env.production = gutil.env.production || process.env.NODE_ENV === 'production';

gutil.env.config = loadConfig(gutil.env.config || 'site/_config.yml');

gutil.env.velvet = velvet.loadEnv({
  config: gutil.env.config,
  environment: gutil.env.production ? 'production' : 'development'
});

// Build

gulp.task('build', cb => {
  runSequence('compile', 'copy', cb);
});

// Develop

gulp.task('develop', cb => {
  runSequence('compile', 'browser-sync', 'watch', cb);
});

// Deploy

gulp.task('deploy', cb => {
  runSequence('build', 'deploy', () => {
    if (gutil.env.deployResult) {
      const service = gutil.env.deployResult.service;
      const host = gutil.env.deployResult.host;

      gutil.log(`Your site has been deployed to ${service}`);
      gutil.log('----------------------------------');
      gutil.log(gutil.colors.green(host));
    }

    cb();
  });
});

gulp.task('default', cb => {
  gutil.log(HELP);
  cb();
});

requireDir('./tasks');
