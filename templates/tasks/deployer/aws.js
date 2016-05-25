'use strict';

const path = require('path');
const url = require('url');
const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpIf = require('gulp-if');
const ignore = require('gulp-ignore');
const runSequence = require('run-sequence');
const awspublish = require('gulp-awspublish');
const s3Website = require('s3-website');
const notify = require('gulp-notify');
const merge = require('merge-stream');
const parallelize = require('concurrent-transform');
const cyan = gutil.colors.cyan;
const logName = `'${cyan('aws')}'`;

const MAX_CONCURRENCY = 5;

const REVISIONED_HEADERS = {
  'Cache-Control': 'max-age=315360000, no-transform, public'
};

const STATIC_HEADERS = {
  'Cache-Control': 'max-age=300, s-maxage=900, no-transform, public'
};

const getManifest = function (dirname, filename) {
  let manifest;

  try {
    const revManifest = require(path.join(dirname, filename || 'revision-manifest.json'));
    manifest = Object.keys(revManifest).map(p => revManifest[p]);
  } catch (e) {
    manifest = [];
  }

  return manifest;
};

const getHostname = function (target, config) {
  let deployUrl = config.url;

  if (target === 'staging' && config.staging_url) {
    deployUrl = config.staging_url;
  }

  return url.parse(deployUrl).hostname;
};

gulp.task('aws:config', cb => {
  const target = gutil.env.target || 'staging';
  const site = gutil.env.velvet.getGlobal('site');

  gutil.env.deployResult = {service: 'AWS/S3'};

  const config = site.config;

  const hostname = getHostname(target, config);

  const s3Config = {
    domain: hostname,
    index: 'index.html',
    error: site.config.error
  };

  if (config.spa) {
    s3Config.routes = [{
      Condition: {
        HttpErrorCodeReturnedEquals: '404'
      },
      Redirect: {
        HostName: hostname
      }
    }];
  }

  s3Website(s3Config, (err, website) => {
    if (err) {
      notify.onError(err);
      return cb(err);
    }

    gutil.env.deployResult.host = website;

    if (website && website.modified) {
      gutil.log(logName, 'Site config updated');
    }

    cb(err);
  });
});

gulp.task('aws:publish', cb => {
  const force = gutil.env.force;
  const target = gutil.env.target || 'staging';
  const site = gutil.env.velvet.getGlobal('site');

  const config = site.config;

  const hostname = getHostname(target, config);

  if (!hostname) {
    return cb();
  }

  const deployDir = config.destination;

  const publisher = awspublish.create({
    params: {
      Bucket: hostname
    }
  });

  const publisherOpts = {force};

  const revManifest = getManifest(deployDir);

  let gzipRevisioned = gutil.noop();
  let plainRevisioned = gutil.noop();

  if (revManifest.length) {
    const revPaths = revManifest.map(p => path.join(deployDir, p));

    gzipRevisioned = gulp.src(revPaths, {base: deployDir})
      .pipe(ignore.include('**/*.{html,js,css,txt}'))
      .pipe(awspublish.gzip())
      .pipe(parallelize(publisher.publish(REVISIONED_HEADERS, publisherOpts), MAX_CONCURRENCY));

    plainRevisioned = gulp.src(revPaths, {base: deployDir})
      .pipe(ignore.exclude('**/*.{html,js,css,txt}'))
      .pipe(parallelize(publisher.publish(REVISIONED_HEADERS, publisherOpts), MAX_CONCURRENCY));
  }

  const gzipStatic = gulp.src(path.join(deployDir, '**/*.+(html|js|css|txt)'))
    .pipe(gulpIf(revManifest.length, ignore.exclude(revManifest)))
    .pipe(awspublish.gzip())
    .pipe(parallelize(publisher.publish(STATIC_HEADERS, publisherOpts), MAX_CONCURRENCY));

  const plainStatic = gulp.src(path.join(deployDir, '/**/*.!(html|js|css|txt)'))
    .pipe(gulpIf(revManifest.length, ignore.exclude(revManifest)))
    .pipe(parallelize(publisher.publish(STATIC_HEADERS, publisherOpts), MAX_CONCURRENCY));

  return merge(gzipRevisioned, gzipStatic, plainRevisioned, plainStatic)
    .on('error', notify.onError())
    .pipe(publisher.sync())
    .on('error', notify.onError())
    .pipe(publisher.cache())
    .on('error', notify.onError())
    .pipe(awspublish.reporter());
});

gulp.task('deployer', cb => runSequence('aws:config', 'aws:publish', cb));
