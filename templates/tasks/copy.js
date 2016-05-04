'use strict';

const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const util = require('gulp-util');
const path = require('path');

gulp.task('copy:htmlmin', () => {
  const config = util.env.velvet.getGlobal('site').config;

  const buildDir = config['build_dir'];
  const destDir = config.destination;

  const htmlminConfig = {
    collapseWhitespace: true,
    preserveLineBreaks: false,
    conservativeCollapse: false,
    removeComments: false,
    removeTagWhitespace: false,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    keepClosingSlash: true,
    quoteCharacter: `'`
  };

  return gulp.src(path.join(buildDir, '/**/*.html'))
    .pipe(htmlmin(htmlminConfig))
    .pipe(gulp.dest(destDir));
});

gulp.task('copy:files', () => {
  const config = util.env.velvet.getGlobal('site').config;

  const buildDir = config['build_dir'];
  const destDir = config.destination;

  return gulp.src(path.join(buildDir, '/**/*.!(html)'))
    .pipe(gulp.dest(destDir));
});

gulp.task('copy', ['copy:htmlmin', 'copy:files']);
