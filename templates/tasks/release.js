'use strict';

const gulp = require('gulp');
const runSequence = require('run-sequence');
const conventionalChangelog = require('gulp-conventional-changelog');
const conventionalGithubReleaser = require('conventional-github-releaser');
const bump = require('gulp-bump');
const gutil = require('gulp-util');
const git = require('gulp-git');
const fs = require('fs');
const notify = require('gulp-notify');

const errorHandler = notify.onError();

gulp.task('release:changelog', () => {
  return gulp.src('CHANGELOG.md', {
    buffer: false
  })
  .pipe(conventionalChangelog({
    preset: 'eslint'
  }))
  .pipe(gulp.dest('./'));
});

gulp.task('release:github-release', cb => {
  const config = gutil.env.config;

  conventionalGithubReleaser({
    type: 'oauth',
    token: process.env.CONVENTIONAL_GITHUB_RELEASER_TOKEN || config.github_token
  }, {
    preset: 'eslint'
  }, cb);
});

gulp.task('release:bump-version', () => {
  let type = 'patch';

  if (gutil.env.major) {
    type = 'major';
  }

  if (gutil.env.minor) {
    type = 'minor';
  }

  return gulp.src('./package.json')
    .pipe(bump({type}).on('error', gutil.log))
    .pipe(gulp.dest('./'));
});

gulp.task('release:commit-changes', () => {
  const commitMessage = gutil.env.message || '[Prerelease] Bumped version number';

  return gulp.src('.')
    .pipe(git.add())
    .pipe(git.commit(commitMessage));
});

gulp.task('release:push-changes', cb => {
  git.push('origin', 'master', cb);
});

gulp.task('release:create-new-tag', cb => {
  const getPackageJsonVersion = function () {
    return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  };

  const version = getPackageJsonVersion();

  git.tag(`v${version}`, `Created Tag for version:  v${version}`, error => {
    if (error) {
      return cb(error);
    }

    git.push('origin', 'master', {args: '--tags'}, cb);
  });
});

gulp.task('release', cb => {
  runSequence(
    'release:bump-version',
    'release:changelog',
    'release:commit-changes',
    'release:push-changes',
    'release:create-new-tag',
    'release:github-release',
    error => {
      if (error) {
        errorHandler(error.message);
      } else {
        gutil.log(gutil.colors.green('Release complete'));
      }
      cb(error);
    });
});
