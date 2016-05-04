/* eslint max-statements:0 */

'use strict';

const path = require('path');
const gulp = require('gulp');
const util = require('gulp-util');
const watch = require('gulp-watch');
const runSequence = require('run-sequence');
const requireDir = require('require-dir');
const yaml = require('js-yaml');
const fs = require('fs');
const velvet = require('velvet');

const loadConfig = function () {
  const filepath = path.resolve(__dirname, util.env.config || '_config.yml');
  const config = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
  config.base = config.base ? path.resolve(config.base) : __dirname;
  return config;
};

// Config
util.env.production = util.env.production || process.env.NODE_ENV === 'production';

util.env.config = loadConfig();

util.env.velvet = velvet.loadEnv({
  config: util.env.config,
  environment: util.env.production ? 'production' : 'development'
});

// Build
gulp.task('build', cb => {
  const tasks = [
    'clean',
    ['documents', 'files', 'sprites'],
    ['scripts', 'styles'],
    'images'
  ];

  runSequence(...tasks, cb);
});

gulp.task('build:public', cb => {
  runSequence('build', 'copy', cb);
});

// Develop
gulp.task('develop', cb => {
  runSequence('watch', 'browser-sync', cb);
});

gulp.task('watch', cb => {
  util.env.watching = true;

  const env = util.env.velvet;
  const site = env.getGlobal('site');

  const reset = function () {
    env.resetCache();
    site.reset();
  };

  const watchStart = function () {
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
  };

  runSequence('build', watchStart);
});

// Deploy
gulp.task('deploy', cb => {
  runSequence('build:public', 'aws', () => {
    if (util.env.website) {
      util.log('Your site has been deployed to AWS');
      util.log('---------------------------------');
      util.log(util.colors.green(util.env.website.url));
    }

    cb();
  });
});

gulp.task('default', cb => {
  const help = [
    '',
    '',
    '---- S T E N C I L ----',
    '',
    'Usage: gulp [task] [options]',
    '',
    'gulp clean',
    'gulp lint [--scripts]',
    'gulp watch',
    'gulp develop [--host, --port]',
    'gulp build [--production]',
    'gulp deploy',
    ''
  ];

  util.log(help.join('\n'));

  cb();
});

requireDir('./tasks');
