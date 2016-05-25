'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const runSequence = require('run-sequence');
const ftp = require('vinyl-ftp');
const notify = require('gulp-notify');

const MAX_CONCURRENCY = 5;

gulp.task('ftp:publish', () => {
  const site = gutil.env.velvet.getGlobal('site');
  const config = site.config;
  const deployConfig = config.deploy || {};

  const host = gutil.env['ftp-host'] || process.env.FTP_HOST || deployConfig.host;
  const directory = gutil.env['ftp-directory'] || process.env.FTP_DIRECTORY || deployConfig.directory;
  const user = gutil.env['ftp-user'] || process.env.FTP_USER || deployConfig.user;
  const password = gutil.env['ftp-password'] || process.env.FTP_PASSWORD || deployConfig.password;

  gutil.env.deployResult = {
    service: 'FTP',
    host
  };

  const conn = ftp.create({
    host,
    user,
    password,
    parallel: MAX_CONCURRENCY,
    log: gutil.log
  });

  return gulp.src('**/*', {base: config.destination, cwd: config.destination, dot: true, buffer: false})
    .pipe(conn.newer(directory))
    .on('error', notify.onError())
    .pipe(conn.dest(directory))
    .on('error', notify.onError());
});

gulp.task('deployer', cb => runSequence('ftp:publish', cb));
