'use strict';

const path = require('path');
const url = require('url');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const notify = require('gulp-notify');
const size = require('gulp-size');
const gulpIf = require('gulp-if');
const runSequence = require('run-sequence');
const merge = require('merge-stream');
const clone = require('hoek').clone;
const velvetGulp = require('velvet').gulp;

const sass = require('gulp-sass');
const nodeSass = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const stylelint = require('stylelint');
const syntaxScss = require('postcss-scss');
const reporter = require('postcss-reporter');
const objectFitImages = require('postcss-object-fit-images');
const qs = require('qs');

const errorHandler = notify.onError();

const getFileUrl = function (site) {
  return function (relpath) {
    const parsed = url.parse(relpath);
    const file = site.getFile(parsed.pathname);

    if (file) {
      file.output = true;
      return `${file.url}${parsed.search || ''}${parsed.hash || ''}`;
    }

    return relpath;
  };
};

const getImageUrl = function (site) {
  return function (relpath, filters) {
    const parsed = url.parse(relpath);
    filters = filters || {};

    if (typeof filters === 'string') {
      filters = qs.parse(filters);
    }

    const image = site.getImage(parsed.pathname);

    if (!image) {
      return relpath;
    }

    let imageUrl = image.url;

    if (Object.keys(filters).length > 0) {
      imageUrl = image.addVariant(filters).url;
    } else {
      image.output = true;
    }

    return `${imageUrl}${parsed.search || ''}${parsed.hash || ''}`;
  };
};

gulp.task('styles:lint', () => {
  const watching = gutil.env.watching;
  const site = gutil.env.velvet.getGlobal('site');

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
  const production = gutil.env.production;
  const watching = gutil.env.watching;

  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const baseDir = config.base;
  const buildDir = config['build_dir'];
  const srcDir = config['styles_dir'];
  const srcOpts = {cwd: srcDir, base: srcDir};

  const sassImporter = function (importPath, prevPath) {
    let file = prevPath;

    if (importPath === 'breakpoint') {
      file = `${baseDir}/node_modules/breakpoint-sass/stylesheets/breakpoint.scss`;
    }

    if (importPath === 'bourbon') {
      file = `${baseDir}/node_modules/bourbon/app/assets/stylesheets/bourbon.scss`;
    }

    if (importPath.startsWith('bootstrap')) {
      const filepath = importPath.replace('bootstrap/', '');
      file = `${baseDir}/node_modules/bootstrap/scss/${filepath}`;
    }

    if (file === prevPath) {
      return null;
    }

    return {file};
  };

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

      const imageUrl = getImageUrl(site)(imagePath.getValue(), filters);

      return new nodeSass.types.String(`url('${imageUrl}')`);
    },
    'file-url($path: "")'(filePath) {
      const fileUrl = getFileUrl(site)(filePath.getValue());
      return new nodeSass.types.String(`url('${fileUrl}')`);
    }
  };

  const postcssProcessors = [
    objectFitImages,
    autoprefixer({browsers: [config.styles.autoprefixer]})
  ];
  {SLUSH{ if (framework === 'starter-kit') { }}
  postcssProcessors.push(require('lost'));
  {SLUSH{ } }}
  const styles = site.styles.filter(style => style.output);

  const tasks = [];

  for (const style of styles) {
    const processors = clone(postcssProcessors);

    if (style.minify) {
      processors.push(cssnano);
    }

    const task = gulp.src(style.path, srcOpts)
      .pipe(gulpIf(watching, plumber({errorHandler})))
      .pipe(velvetGulp.init())
      .pipe(gulpIf(!production, sourcemaps.init()))
      .pipe(sass({importer: sassImporter, functions: sassFunctions}).on('error', sass.logError))
      .pipe(postcss(processors))
      .pipe(velvetGulp.destination())
      .pipe(gulpIf(!production, sourcemaps.write('./')));

    tasks.push(task);
  }

  if (!tasks.length) {
    return gulp.src('.').pipe(gutil.noop());
  }

  return merge(tasks)
    .pipe(size({title: 'styles'}))
    .pipe(gulp.dest(buildDir))
    .pipe(velvetGulp.revisionManifest({base: buildDir, merge: true}))
    .pipe(gulp.dest(buildDir));
});

gulp.task('styles', cb => runSequence('styles:lint', 'styles:build', cb));
