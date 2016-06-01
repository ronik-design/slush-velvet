'use strict';

const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const url = require('url');
const async = require('async');
const install = require('gulp-install');
const conflict = require('gulp-conflict');
const rename = require('gulp-rename');
const template = require('gulp-template');
const jeditor = require('gulp-json-editor');
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

const parseGithubRepo = function (str) {
  const githubRe = /(?:https?:\/\/github.com)?\/?([^\/.]+\/[^\/.]+)(?:\.git)?$/i;
  const match = str.match(githubRe);

  if (match && match[1]) {
    return match[1];
  }

  return null;
};

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
    name: 'staging',
    message: 'Do you want a separate staging site?',
    type: 'confirm',
    default() {
      return false;
    }
  }, {
    name: 'stagingUrl',
    message: 'What is the staging url?',
    when(answers) {
      return answers.staging;
    },
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
    message: 'GitHub repo name? (e.g. foo/bar, https://github.com/foo/bar.git)',
    validate(str) {
      if (str === null) {
        return false;
      }
      return true;
    },
    filter(str) {
      if (str) {
        return parseGithubRepo(str);
      }
    }
  }, {
    name: 'githubToken',
    message: 'GitHub token for the releaser?',
    when(answers) {
      return answers.github;
    },
    default: ''
  }, {
    name: 'framework',
    message: 'Which framework would you like to use?',
    type: 'list',
    choices: [{
      name: 'Starter Kit (BEM-based styles, Knockout scripts, Lost grid system)',
      value: 'starter-kit'
    }, {
      name: 'Bootstrap (Bootstrap v4, jQuery and support scripts)',
      value: 'bootstrap'
    }, {
      name: 'Blank (nothing at all, just a stub to start with, and some script polyfills)',
      value: 'blank'
    }]
  }, {
    name: 'spa',
    message: 'Is this a single-page application?',
    type: 'confirm',
    default() {
      return false;
    }
  }, {
    name: 'deployer',
    message: 'How would you like to deploy your site?',
    type: 'list',
    choices: [{
      name: 'Amazon AWS / S3 Bucket',
      value: 'aws'
    }, {
      name: 'FTP',
      value: 'ftp'
    }, {
      name: 'None',
      value: 'none'
    }]
  }, {
    name: 'awsBucket',
    message: 'What bucket name would you like to use? (otherwise it will be derived from the url)',
    when(answers) {
      return answers.deployer === 'aws';
    },
    default(answers) {
      return url.parse(answers.url).hostname;
    }
  }, {
    name: 'ftpHost',
    message: 'What is your FTP hostname?',
    when(answers) {
      return answers.deployer === 'ftp';
    }
  }, {
    name: 'ftpDirectory',
    message: 'What is your FTP directory?',
    when(answers) {
      return answers.deployer === 'ftp';
    },
    default() {
      return '/public_html';
    }
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

    config.deployer = config.deployer || 'none';
    config.generatorVersion = pkg.version;
    config.year = moment.tz(new Date(), answers.timezone).format('YYYY');

    const binaryFileExtensions = 'png|ico|gif|jpg|jpeg|svg|psd|bmp|webp|webm';

    const srcDir = path.join(__dirname, 'templates');
    const destDir = dest();

    const installTextFiles = function (cb) {
      const src = [
        `**/*.!(${binaryFileExtensions})`,
        '!tasks',
        '!tasks/**',
        '!site/_styles',
        '!site/_styles/**',
        '!site/_scripts',
        '!site/_scripts/**',
        '!.DS_Store',
        '!**/.DS_Store',
        '!package.json'
      ];

      gulp.src(src, {dot: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installBinaryFiles = function (cb) {
      const src = [
        `**/*.+(${binaryFileExtensions})`,
        '!tasks',
        '!tasks/**',
        '!site/_styles',
        '!site/_styles/**',
        '!site/_scripts',
        '!site/_scripts/**',
        '!.DS_Store',
        '!**/.DS_Store',
        '!package.json'
      ];

      gulp.src(src, {dot: true, cwd: srcDir, base: srcDir})
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installStyleCommonFiles = function (cb) {
      const src = [
        'site/_styles/*',
        '!.DS_Store',
        '!**/.DS_Store'
      ];

      gulp.src(src, {dot: true, nodir: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installStyleFiles = function (cb) {
      const src = [
        `site/_styles/${config.framework}/**/*`,
        '!.DS_Store',
        '!**/.DS_Store'
      ];

      gulp.src(src, {dot: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(rename(filepath => {
          filepath.dirname = filepath.dirname.replace(`/${config.framework}`, '');
          return;
        }))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installScriptCommonFiles = function (cb) {
      const src = [
        'site/_scripts/*',
        '!.DS_Store',
        '!**/.DS_Store'
      ];

      gulp.src(src, {dot: true, nodir: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installScriptFiles = function (cb) {
      const src = [
        `site/_scripts/${config.framework}/**/*`,
        '!.DS_Store',
        '!**/.DS_Store'
      ];

      gulp.src(src, {dot: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(rename(filepath => {
          filepath.dirname = filepath.dirname.replace(`/${config.framework}`, '');
          return;
        }))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installTaskCommonFiles = function (cb) {
      const src = [
        'tasks/*',
        '!.DS_Store',
        '!**/.DS_Store'
      ];

      gulp.src(src, {dot: true, nodir: true, cwd: srcDir, base: srcDir})
        .pipe(template(config, TEMPLATE_SETTINGS))
        .pipe(conflict(destDir, {logger: console.log}))
        .pipe(gulp.dest(destDir))
        .on('end', cb);
    };

    const installTaskDeployFiles = function (cb) {
      const src = [
        `tasks/deployer/${config.deployer}.js`
      ];

      gulp.src(src, {dot: true, nodir: true, cwd: srcDir, base: srcDir})
        .pipe(rename(filepath => {
          filepath.dirname = filepath.dirname.replace(`/deployer`, '');
          filepath.basename = 'deployer';
          return;
        }))
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
      installBinaryFiles,
      installStyleCommonFiles,
      installStyleFiles,
      installScriptCommonFiles,
      installScriptFiles,
      installTaskCommonFiles,
      installTaskDeployFiles,
      mergePackageAndInstall
    ];

    async.series(tasks, done);
  });
});
