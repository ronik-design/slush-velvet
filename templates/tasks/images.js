'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const size = require('gulp-size');
const runSequence = require('run-sequence');
const sharp = require('gulp-sharp');
const cached = require('gulp-cached');
const merge = require('merge-stream');
const velvetGulp = require('velvet').gulp;
const through = require('through2');

const TASK = 'images';

const imageTransform = function () {
  const transform = function (file, enc, done) {
    if (!file.velvetObj || !file.velvetObj.filters) {
      return done(null, file);
    }

    // Pipe into the sharp transform
    gulp.src(file.path, {read: false})
      .pipe(sharp(file.velvetObj.filters))
      .pipe(through.obj((f, e, cb) => {
        // Get the transformed or read file contents
        file.contents = f.contents;

        // return from parent transform
        done(null, file);

        // return from this
        cb();
      }))
      .on('error', done);
  };

  return through.obj(transform);
};

gulp.task('images:transform', () => {
  const watching = gutil.env.watching;
  const errorHandler = notify.onError();

  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const srcDir = config['images_dir'];
  const buildDir = config['build_dir'];

  const images = site.images.filter(image => image.output);

  const tasks = images.map(image => {
    return gulp.src(image.path, {cwd: srcDir, base: srcDir})
      .pipe(gulpIf(watching, plumber({errorHandler})))
      .pipe(velvetGulp.init())
      .pipe(velvetGulp.destination())
      .pipe(cached(TASK, {optimizeMemory: true}))
      .pipe(velvetGulp.destination({restore: true}))
      .pipe(imageTransform())
      .pipe(velvetGulp.destination());
  });

  if (!tasks.length) {
    return gulp.src('.').pipe(gutil.noop());
  }

  return merge(tasks)
    .pipe(size({title: 'images'}))
    .pipe(gulp.dest(buildDir))
    .pipe(velvetGulp.revisionManifest({base: buildDir, merge: true}))
    .pipe(gulp.dest(buildDir));
});

gulp.task('images', cb => runSequence('images:transform', cb));