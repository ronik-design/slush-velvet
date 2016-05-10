'use strict';

const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const async = require('async');
const install = require('gulp-install');
const conflict = require('gulp-conflict');
const template = require('gulp-template');
const jeditor = require('gulp-json-editor');
const ignore = require('gulp-ignore');
const clone = require('lodash.clone');
const merge = require('lodash.merge');
const slugify = require('uslug');
const inquirer = require('inquirer');
const iniparser = require('iniparser');
const moment = require('moment-timezone');

const pkg = require('./package.json');

const TEMPLATE_SETTINGS = {
  evaluate: /\{SLUSH\{(.+?)\}\}/g,
  interpolate: /\{SLUSH\{=(.+?)\}\}/g,
  escape: /\{SLUSH\{-(.+?)\}\}/g
};

const format = function (string) {
  if (string) {
    return string.toLowerCase().replace(/\s/g, '');
  }
  return '';
};

const dest = function (filepath) {
  return path.resolve(process.cwd(), filepath || './');
};

const defaults = (function () {
  const homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  const workingDirName = process.cwd().split('/').pop().split('\\').pop();
  const workingDirNoExt = workingDirName.replace(/\.[a-z]{2,3}$/, '');
  const osUserName = homeDir && homeDir.split('/').pop() || 'root';
  const configFile = `${homeDir}/.gitconfig`;

  let user = {};

  if (require('fs').existsSync(configFile)) {
    user = iniparser.parseSync(configFile).user;
  }

  return {
    name: workingDirName,
    slug: slugify(workingDirNoExt),
    userName: format(user.name) || osUserName,
    authorEmail: user.email || '',
    timezone: moment.tz.guess()
  };
})();

gulp.task('default', done => {
  const prompts = [{
    name: 'name',
    message: 'What is the PRETTY name of your site?',
    default: defaults.name
  }, {
    name: 'slug',
    message: 'What is the name SLUG for your site?',
    default: defaults.slug,
    validate(slug) {
      return slug === slugify(slug);
    }
  }, {
    name: 'url',
    message: 'What is the url for your site?',
    default(answers) {
      return `http://www.${answers.slug}.com`;
    }
  }, {
    name: 'stagingUrl',
    message: 'What is the staging url for your site?',
    default(answers) {
      return `http://stage-www.${answers.slug}.com`;
    }
  }, {
    name: 'author',
    message: 'Who is authoring the site?',
    default() {
      let author = defaults.userName;
      if (defaults.authorEmail) {
        author += ` <${defaults.authorEmail}>`;
      }
      return author;
    }
  }, {
    name: 'description',
    message: 'Please describe your site.'
  }, {
    name: 'keywords',
    message: 'Please enter some site keywords.'
  }, {
    name: 'timezone',
    message: 'What is the timezone for your site?',
    default: defaults.timezone
  }, {
    name: 'version',
    message: 'What is the version of your site?',
    default: '0.1.0'
  }, {
    name: 'github',
    message: 'GitHub repo name?'
  }, {
    name: 'styles',
    message: 'Which style framework would you like to use?',
    type: 'list',
    choices: [{
      name: 'Bootstrap',
      value: 'bootstrap'
    }, {
      name: 'Starter Kit (unstyled, BEM-based framework)',
      value: 'starter-kit'
    }]
  }, {
    type: 'confirm',
    name: 'moveon',
    message: 'Continue?'
  }];

  // Ask
  inquirer.prompt(prompts).then(answers => {
    if (!answers.moveon) {
      return done();
    }

    const config = clone(answers);

    if (answers.github) {
      const githubRe = /(?:https?:\/\/github.com)?\/?([^\/.]+\/[^\/.]+)(?:\.git)?$/i;
      const match = answers.github.match(githubRe);
      if (match && match[1]) {
        config.github = match[1];
      } else {
        config.github = null;
      }
    }

    config.generatorVersion = pkg.version;
    config.year = moment.tz(new Date(), answers.timezone).format('YYYY');

    const binaryFileExtensions = 'png|ico|gif|jpg|jpeg|svg|psd|bmp|webp|webm';

    const srcDir = path.join(__dirname, 'templates');
    const destDir = dest();

    const installTextFiles = function (cb) {
      const exclude = [
        '{site/_styles,site/_styles/**,site/_styles/**/.*}',
        'package.json'
      ];

      gulp.src(`**/*.!(${binaryFileExtensions})`, {dot: true, cwd: srcDir, base: srcDir})
        .pipe(ignore.exclude(exclude))
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installStyleFiles = function (cb) {
      gulp.src(`${srcDir}/site/_styles/${config.styles}/**/*`, {dot: true})
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(dest('site/_styles')))
        .on('end', cb);
    };

    const installBinaryFiles = function (cb) {
      const exclude = [
        '{site/_styles,site/_styles/**,site/_styles/**/.*}',
        'package.json'
      ];

      gulp.src(`**/*.+(${binaryFileExtensions})`, {dot: true, cwd: srcDir, base: srcDir})
        .pipe(ignore.exclude(exclude))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const mergePackageAndInstall = function (cb) {
      const pkgMerge = function (pkg) {
        if (fs.existsSync(dest('package.json'))) {
          const existingPkg = require(dest('package.json'));
          return merge(existingPkg, pkg);
        }
        return pkg;
      };

      gulp.src('package.json', {dot: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(jeditor(pkgMerge, {
          'indent_char': ' ',
          'indent_size': 2
        }))
        .pipe(gulp.dest(destDir))
        .pipe(install())
        .on('end', cb);
    };

    const tasks = [
      installTextFiles,
      installStyleFiles,
      installBinaryFiles,
      mergePackageAndInstall
    ];

    async.series(tasks, done);
  });
});
