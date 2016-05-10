'use strict';

const gulp = require('gulp');
const glob = require('glob');
const path = require('path');
const merge = require('merge-stream');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const svgSprite = require('gulp-svg-sprite');

gulp.task('sprites', () => {
  const watching = gutil.env.watching;
  const errorHandler = notify.onError();

  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const srcDir = path.join(config.source, config['sprites_dir']);
  const destDir = path.join(config['build_dir'], config['sprites_path']);

  const folders = glob.sync('*/', {cwd: srcDir});

  const tasks = folders.map(folder => {
    const folderName = folder.substr(0, folder.length - 1);
    const taskConfig = {
      mode: {
        stack: {dest: '.', sprite: `${folderName}.stack.svg`}
      }
    };

    return gulp.src(path.join(srcDir, folder, '**/*.svg'))
      .pipe(gulpIf(watching, plumber({errorHandler})))
      .pipe(svgSprite(taskConfig))
      .pipe(gulp.dest(destDir));
  });

  const root = gulp.src(path.join(srcDir, '*.svg'))
      .pipe(gulpIf(watching, plumber({errorHandler})))
      .pipe(svgSprite({mode: {stack: {dest: '.', sprite: 'main.stack.svg'}}}))
      .pipe(gulp.dest(destDir));

  return merge(tasks, root);
});
