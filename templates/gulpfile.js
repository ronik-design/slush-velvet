'use strict';

const HELP = `

---- V E L V E T ----

Usage: gulp [task] [options]

gulp develop [--host, --port]
gulp build [--production]
gulp deploy [--production, --target=[staging,production]]
gulp release [--message]

`;

const gulp = require('gulp');
const gutil = require('gulp-util');
const runSequence = require('run-sequence');
const loadConfig = require('./utils/load-config');

// Config

const PRODUCTION = gutil.env.production || process.env.NODE_ENV === 'production';
const CONFIG = gutil.env.config || 'site/_config.yml';

const opts = {
  config: loadConfig(CONFIG),
  environment: PRODUCTION ? 'production' : 'development'
};

require('velvet-gulp')(gulp, opts);

// Build

gulp.task('build', cb => {
  runSequence('generate', 'copy', cb);
});

// Develop

gulp.task('develop', cb => {
  runSequence('generate', 'browser-sync', 'watch', cb);
});

// Deploy

gulp.task('deploy', cb => {
  runSequence('build', 'deployer', cb);
});

// Help

gulp.task('default', cb => {
  gutil.log(HELP);
  cb();
});
