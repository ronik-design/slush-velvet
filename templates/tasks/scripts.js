'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const path = require('path');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const gulpIf = require('gulp-if');
const merge = require('merge-stream');
const hoek = require('hoek');
const runSequence = require('run-sequence');
const cached = require('gulp-cached');
const size = require('gulp-size');
const velvetGulp = require('velvet').gulp;

notify.logLevel(0);

const TASK = 'scripts';

const MINIFY_DEFAULTS = {
  'screw_ie8': true,
  'properties': true,
  'dead_code': false,
  'unused': false,
  'drop_debugger': true,
  'warnings': true,
  'keep_fargs': true
};

const getConfig = function (scriptsDir, options) {
  let configPath;

  if (options.production) {
    configPath = path.join(scriptsDir, 'webpack.production.config.js');
  } else {
    configPath = path.join(scriptsDir, 'webpack.development.config.js');
  }

  return require(configPath);
};

gulp.task('scripts:copy', () => {
  const watching = gutil.env.watching;
  const errorHandler = notify.onError();

  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const scriptsDir = config['scripts_dir'];
  const buildDir = config['build_dir'];

  const scripts = site.scripts
    .filter(script => script.output && !script.bundle)
    .map(script => script.path);

  return gulp.src(scripts, {cwd: scriptsDir, base: scriptsDir})
    .pipe(gulpIf(watching, plumber({errorHandler})))
    .pipe(cached(TASK))
    .pipe(velvetGulp.init())
    .pipe(size({title: 'scripts:copy'}))
    .pipe(velvetGulp.destination())
    .pipe(gulp.dest(buildDir))
    .pipe(velvetGulp.revisionManifest({base: buildDir, merge: true}))
    .pipe(gulp.dest(buildDir));
});

gulp.task('scripts:bundle', () => {
  const production = gutil.env.production;
  const watching = gutil.env.watching;
  const errorHandler = notify.onError();

  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;

  const buildDir = config['build_dir'];
  const scriptsDir = config['scripts_dir'];

  const webpackConfig = getConfig(scriptsDir, {production});

  webpackConfig.eslint = {configFile: path.join(scriptsDir, '.eslintrc')};

  const scripts = site.scripts.filter(script => script.bundle);

  const tasks = [];

  for (const script of scripts) {
    const webpackConfigCopy = hoek.clone(webpackConfig);
    webpackConfigCopy.output = {filename: script.destination};

    if (script.minify) {
      const minifySettings = hoek.reach(config, 'scripts.minify.settings') || {};
      const uglifyOpts = {compress: Object.assign(MINIFY_DEFAULTS, minifySettings)};
      const uglify = new webpack.optimize.UglifyJsPlugin(uglifyOpts);
      webpackConfigCopy.plugins.push(uglify);
    }

    tasks.push(gulp.src(script.path, {cwd: scriptsDir, base: scriptsDir})
      .pipe(gulpIf(watching, plumber({errorHandler})))
      .pipe(velvetGulp.init({filepath: script.filepath}))
      .pipe(webpackStream(webpackConfigCopy, webpack))
      .pipe(velvetGulp.destination()));
  }

  if (!tasks.length) {
    return gulp.src('.').pipe(gutil.noop());
  }

  return merge(tasks)
    .pipe(size({title: 'scripts'}))
    .pipe(gulp.dest(buildDir))
    .pipe(velvetGulp.revisionManifest({base: buildDir, merge: true}))
    .pipe(gulp.dest(buildDir));
});

gulp.task('scripts', cb => runSequence('scripts:copy', 'scripts:bundle', cb));
