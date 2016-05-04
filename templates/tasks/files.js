'use strict';

const path = require('path');
const gulp = require('gulp');
const util = require('gulp-util');
const gulpIf = require('gulp-if');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const size = require('gulp-size');
const cached = require('gulp-cached');

const TASK = 'files';

gulp.task('files', () => {
  const watching = util.env.watching;
  const errorHandler = notify.onError();

  const env = util.env.velvet;
  const site = env.getGlobal('site');
  const config = site.config;

  const srcDir = config.source;
  const srcPaths = site.files.map(file => path.join(srcDir, file.path));
  const destDir = config['build_dir'];

  return gulp.src(srcPaths, {base: srcDir})
    .pipe(gulpIf(watching, plumber({errorHandler})))
    .pipe(cached(TASK))
    .pipe(size({title: 'files'}))
    .pipe(gulp.dest(destDir));
});
