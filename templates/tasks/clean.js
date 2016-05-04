'use strict';

const path = require('path');
const gulp = require('gulp');
const util = require('gulp-util');
const del = require('del');

gulp.task('clean', cb => {
  const watching = util.env.watching;
  const site = util.env.velvet.getGlobal('site');
  const config = site.config;

  const buildDir = config['build_dir'];
  const deployDir = config['destination'];

  const dirs = [path.join(buildDir, '/**/*')];

  if (!watching && deployDir) {
    dirs.push(path.join(deployDir, '/**/*'));
  }

  del.sync(dirs);

  cb();
});
