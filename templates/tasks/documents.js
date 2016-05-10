'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const size = require('gulp-size');
const velvetGulp = require('velvet').gulp;

const getDocPaths = function (site) {
  const docPaths = [];

  for (const label in site.collections) {
    const collection = site.collections[label];
    for (const doc of collection.docs) {
      docPaths.push(doc.filepath);
    }
  }

  return docPaths;
};

gulp.task('documents', () => {
  const watching = gutil.env.watching;
  const errorHandler = notify.onError();

  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const srcDir = config.source;
  const srcPaths = getDocPaths(site);
  const destDir = config['build_dir'];

  return gulp.src(srcPaths, {base: srcDir})
    .pipe(gulpIf(watching, plumber({errorHandler})))
    .pipe(velvetGulp.init())
    .pipe(velvetGulp.render())
    .pipe(size({title: 'documents'}))
    .pipe(gulp.dest(destDir));
});
