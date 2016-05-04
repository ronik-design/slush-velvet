/* eslint max-statements:0 */
/* eslint max-params:0 */
/* eslint max-len:0 */

'use strict';

const path = require('path');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const util = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const size = require('gulp-size');
const gulpIf = require('gulp-if');
const runSequence = require('run-sequence');
const merge = require('merge-stream');
const clone = require('hoek').clone;
const velvet = require('velvet').gulp;

const sass = require('gulp-sass');
const nodeSass = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const lost = require('lost');
const stylelint = require('stylelint');
const syntaxScss = require('postcss-scss');
const reporter = require('postcss-reporter');
const objectFitImages = require('postcss-object-fit-images');
const qs = require('qs');

const errorHandler = notify.onError();

const getImageUrl = function (site) {
  return function (relpath, filters) {
    filters = filters || {};

    if (typeof filters === 'string') {
      filters = qs.parse(filters);
    }

    const image = site.getImage(relpath);

    if (!image) {
      return '';
    }

    let url = image.url;

    if (Object.keys(filters).length > 0) {
      url = image.addVariant(filters).url;
    } else {
      image.output = true;
    }

    return url;
  };
};

gulp.task('styles:lint', () => {
  const watching = util.env.watching;
  const site = util.env.velvet.getGlobal('site');

  const srcDir = site.config['styles_dir'];

  const processors = [
    stylelint({configFile: path.join(srcDir, '.stylelintrc')}),
    reporter({clearMessages: true, throwError: true})
  ];

  return gulp.src(path.join(srcDir, '/**/*.{sass,scss}'))
    .pipe(gulpIf(watching, plumber({errorHandler})))
    .pipe(postcss(processors), {syntax: syntaxScss});
});

gulp.task('styles:build', () => {
  const production = util.env.production;
  const watching = util.env.watching;

  const site = util.env.velvet.getGlobal('site');
  const config = site.config;

  const baseDir = config.base;
  const buildDir = config['build_dir'];
  const srcDir = config['styles_dir'];
  const srcOpts = {cwd: srcDir, base: srcDir};

  const sassPaths = [
    `${baseDir}/node_modules/breakpoint-sass/stylesheets`,
    `${baseDir}/node_modules/bourbon/app/assets/stylesheets`
  ];

  const sassFunctions = {
    'image-url($path: "", $width: 0, $height: 0, $crop: "", $grayscale: false, $quality: 0, $max: false, $rotate: false, $sharpen: false)'(imagePath, width, height, crop, grayscale, quality, max, rotate, sharpen) {
      const filters = {};

      if (width.getValue()) {
        filters.resize = filters.resize || [];
        filters.resize[0] = width.getValue();
      }

      if (height.getValue()) {
        filters.resize = filters.resize || [];
        filters.resize[1] = height.getValue();
      }

      if (crop.getValue()) {
        filters.crop = crop.getValue();
      }

      if (grayscale.getValue()) {
        filters.grayscale = grayscale.getValue();
      }

      if (quality.getValue()) {
        filters.quality = quality.getValue();
      }

      if (max.getValue()) {
        filters.max = max.getValue();
      }

      if (sharpen.getValue()) {
        filters.sharpen = sharpen.getValue();
      }

      if (rotate.getValue()) {
        filters.rotate = rotate.getValue();
      }

      const iUrl = getImageUrl(site)(imagePath.getValue(), filters);

      return new nodeSass.types.String(`url('${iUrl}')`);
    }
  };

  const postcssProcessors = [
    objectFitImages,
    lost,
    autoprefixer({browsers: [config.styles.autoprefixer]})
  ];

  const styles = site.styles.filter(style => style.output);

  const tasks = [];

  for (const style of styles) {
    const processors = clone(postcssProcessors);

    if (style.minify) {
      processors.push(cssnano);
    }

    const task = gulp.src(style.path, srcOpts)
      .pipe(gulpIf(watching, plumber({errorHandler})))
      .pipe(velvet.init())
      .pipe(gulpIf(!production, sourcemaps.init()))
      .pipe(sass({includePaths: sassPaths, functions: sassFunctions}).on('error', sass.logError))
      .pipe(postcss(processors))
      .pipe(velvet.destination())
      .pipe(gulpIf(!production, sourcemaps.write('./')));

    tasks.push(task);
  }

  if (!tasks.length) {
    return gulp.src('.').pipe(util.noop());
  }

  return merge(tasks)
    .pipe(size({title: 'styles'}))
    .pipe(gulp.dest(buildDir))
    .pipe(velvet.revisionManifest({base: buildDir, merge: true}))
    .pipe(gulp.dest(buildDir));
});

gulp.task('styles', cb => runSequence('styles:lint', 'styles:build', cb));
