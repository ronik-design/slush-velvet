'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const watch = require('gulp-watch');
const runSequence = require('run-sequence');

gulp.task('watch', cb => {
  gutil.env.watching = true;

  const env = gutil.env.velvet;
  const site = env.getGlobal('site');

  const reset = function () {
    env.resetCache();
    site.reset();
  };

  const config = site.config;
  const mdExt = config['markdown_ext'].split(',');
  const htmlExt = config['html_ext'].split(',');
  const scriptsExt = config['scripts_ext'].split(',');
  const stylesExt = config['styles_ext'].split(',');
  const imagesExt = config['images_ext'].split(',');

  const docExt = [].concat(mdExt).concat(htmlExt).join('|');

  watch(`${config.source}/**/*.+(${docExt})`, () => {
    reset();
    runSequence('documents', 'styles', 'scripts', 'images');
  });

  watch(`${config['data_dir']}/**/*`, file => {
    site.deleteObject(file.path);
    runSequence('documents', 'styles', 'scripts', 'images');
  });

  const jsExt = scriptsExt.join('|');

  watch(`${config['scripts_dir']}/**/*.+(${jsExt})`, () => {
    runSequence('scripts');
  });

  const cssExt = stylesExt.join('|');

  watch(`${config['styles_dir']}/**/*.+(${cssExt})`, () => {
    runSequence('styles');
  });

  const imgExt = imagesExt.join('|');

  watch(`${config['images_dir']}/**/*.+(${imgExt})`, () => {
    runSequence('images');
  });

  watch(`${config['sprites_dir']}/**/*.+(svg)`, () => {
    runSequence('sprites');
  });

  const exceptExt = [].concat(mdExt)
    .concat(htmlExt)
    .concat(scriptsExt)
    .concat(stylesExt)
    .concat(imagesExt)
    .join('|');

  watch(`${config.source}/**/*.!(${exceptExt})`, () => {
    runSequence('files');
  });

  cb();
});
