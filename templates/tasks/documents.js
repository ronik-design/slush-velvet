'use strict';

const path = require('path');
const gulp = require('gulp');
const util = require('gulp-util');
const gulpIf = require('gulp-if');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const size = require('gulp-size');
const velvet = require('velvet').gulp;

const getDocPaths = function (site) {
  const docPaths = [];

  for (const label in site.collections) {
    const collection = site.collections[label];
    for (const doc of collection.docs) {
      docPaths.push(path.join(collection.directory, doc.path));
    }
  }

  return docPaths;
};

gulp.task('documents', () => {
  const watching = util.env.watching;
  const errorHandler = notify.onError();

  const env = util.env.velvet;
  const site = env.getGlobal('site');
  const config = site.config;

  const srcDir = config.source;
  const srcPaths = getDocPaths(site);
  const destDir = config['build_dir'];

  return gulp.src(srcPaths, {base: srcDir})
    .pipe(gulpIf(watching, plumber({errorHandler})))
    .pipe(velvet.render({env}))
    .pipe(size({title: 'documents'}))
    .pipe(gulp.dest(destDir));
});
