'use strict';

const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const del = require('del');

gulp.task('clean', cb => {
  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const dirs = [
    path.join(config['build_dir'], '/**/*'),
    path.join(config.destination, '/**/*')
  ];

  del.sync(dirs);

  cb();
});
