'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const size = require('gulp-size');
const cached = require('gulp-cached');
const velvetGulp = require('velvet').gulp;

const TASK = 'files';

const getFilePaths = function (site) {
  const filePaths = site.files.map(file => file.filepath);

  for (const label in site.collections) {
    const collection = site.collections[label];
    for (const file of collection.files) {
      filePaths.push(file.filepath);
    }
  }

  return filePaths;
};

gulp.task('files', () => {
  const watching = gutil.env.watching;
  const errorHandler = notify.onError();

  const env = gutil.env.velvet;
  const site = env.getGlobal('site');
  const config = site.config;

  const srcDir = config.source;
  const srcPaths = getFilePaths(site);
  const buildDir = config['build_dir'];

  return gulp.src(srcPaths, {base: srcDir})
    .pipe(gulpIf(watching, plumber({errorHandler})))
    .pipe(cached(TASK))
    .pipe(velvetGulp.init())
    .pipe(velvetGulp.destination())
    .pipe(size({title: 'files'}))
    .pipe(gulp.dest(buildDir))
    .pipe(velvetGulp.revisionManifest({base: buildDir, merge: true}))
    .pipe(gulp.dest(buildDir));
});
