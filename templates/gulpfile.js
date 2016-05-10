'use strict';

const HELP = `

---- S T E N C I L ----

Usage: gulp [task] [options]

gulp develop [--host, --port]
gulp build [--production]
gulp deploy [--production, --target=[staging,production]]

`;

const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const runSequence = require('run-sequence');
const requireDir = require('require-dir');
const yaml = require('js-yaml');
const fs = require('fs');
const velvet = require('velvet');

// Config

const loadConfig = function () {
  const filepath = path.resolve(__dirname, gutil.env.config || '_config.yml');
  const config = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
  config.base = config.base ? path.resolve(config.base) : __dirname;
  return config;
};

gutil.env.production = gutil.env.production || process.env.NODE_ENV === 'production';

gutil.env.config = loadConfig();

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
  runSequence('build', 'deploy:aws', () => {
    if (gutil.env.website) {
      gutil.log('Your site has been deployed to AWS');
      gutil.log('----------------------------------');
      gutil.log(gutil.colors.green(gutil.env.website));
    }

    cb();
  });
});

gulp.task('default', cb => {
  gutil.log(HELP);
  cb();
});

requireDir('./tasks');
