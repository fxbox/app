/* eslint-env node */

'use strict';

const gulp = require('gulp');

const concat = require('gulp-concat');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const zip = require('gulp-zip');
const del = require('del');
const runSequence = require('run-sequence');
const webserver = require('gulp-webserver');
const mocha = require('gulp-mocha');
const gls = require('gulp-live-server');
const gsww = require('gulp-sww');
const pkg = require('./package.json');

const APP_ROOT = './app/';
const TESTS_ROOT = './tests/';

const DIST_ROOT = './dist/';
const DIST_APP_ROOT = './dist/app/';
const DIST_TESTS_ROOT = './dist/tests/';

let webserverStream;
let foxboxSimulator;
let registrationServerSimulator;

/**
 * Runs eslint on all javascript files found in the app and tests dirs.
 */
gulp.task('lint', function() {
  // Note: To have the process exit with an error code (1) on lint error, return
  // the stream and pipe to failOnError last.
  return gulp.src([
      `${APP_ROOT}**/*.{js,jsx}`,
      `${TESTS_ROOT}**/*.js`,
      './*.js',
      `!${APP_ROOT}components/**`,
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

/**
 * Copies necessary files for the Babel amd loader to the app.
 */
gulp.task('loader-polyfill', function() {
  return gulp.src([
      './node_modules/alameda/alameda.js',
      `${APP_ROOT}js/bootstrap.js`,
    ])
    .pipe(concat('initapp.js'))
    .pipe(gulp.dest(`${DIST_APP_ROOT}js`));
});

/**
 * Copy all non-js directory app source/assets/components.
 */
gulp.task('copy-app', function() {
  return gulp.src([
      `${APP_ROOT}**`,
      `!${APP_ROOT}js/**/*.js`, // do not copy js
    ])
    .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Apply Babel transform to the JS and JSX files.
 */
gulp.task('babel-app', function() {
  const files = [
    `${APP_ROOT}js/**/*.{js,jsx}`,
  ];

  try {
    return gulp.src(files)
      .pipe(babel().on('error', function(e) {
          console.log('error running Babel', e);
        })
      )
      .pipe(gulp.dest(`${DIST_APP_ROOT}js/`));
  } catch (e) {
    console.log('Got error in Babel', e);
  }
});

/**
 * Process unit test files with Babel.
 */
gulp.task('babel-unit-tests', function() {
  try {
    return gulp.src([`${TESTS_ROOT}unit/**/*.js`])
      .pipe(
        babel().on('error', function(e) {
          console.error('Error occurred while running Babel', e);
        })
      )
      .pipe(gulp.dest(`${DIST_TESTS_ROOT}unit/`));
  } catch (e) {
    console.error('Error occurred while process unit test files with Babel', e);
  }
});

gulp.task('remove-useless', function() {
  return del([
    `${DIST_APP_ROOT}js/**/*.jsx`,
    `${DIST_APP_ROOT}**/*.md`,
  ]);
});

/**
 * Packages the application into a zip.
 */
gulp.task('zip', function() {
  return gulp.src(DIST_APP_ROOT)
    .pipe(zip('app.zip'))
    .pipe(gulp.dest(DIST_ROOT));
});

/**
 * Runs travis tests.
 */
gulp.task('travis', ['lint', 'loader-polyfill', 'babel-app']);

/**
 * Build the app.
 */
gulp.task('build', function(cb) {
  runSequence(
    ['lint'], ['clobber-app'], ['loader-polyfill', 'copy-app'], ['babel-app'],
    ['remove-useless'], ['offline'], cb
  );
});

/**
 * Add Service Worker and offline support
 */
gulp.task('offline', () => {
  gulp.src(['**/*'], { cwd: DIST_APP_ROOT })
    .pipe(gsww({
      version: pkg.version,
      hookSW: 'hookSW.js',
    }))
    .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Build unit tests.
 */
gulp.task('build-unit-tests', function(cb) {
  runSequence('clobber-tests', 'babel-unit-tests', cb);
});

/**
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', function() {
  gulp.watch([`${APP_ROOT}**`], ['build']);
});

gulp.task('webserver', function() {
  webserverStream = gulp.src(DIST_APP_ROOT)
    .pipe(webserver({
      port: process.env.PORT || 8000,
      host: process.env.HOSTNAME || 'localhost',
      livereload: false,
      directoryListing: false,
      open: false,
      https: { key: './certs/key.pem', cert: './certs/cert.pem' },
    }));
});

gulp.task('stop-webserver', function() {
  webserverStream.emit('kill');
});

/**
 * The default task when `gulp` is run.
 * Adds a listener which will re-build on a file save.
 */
gulp.task('default', function() {
  runSequence('build', 'webserver', 'watch');
});

/**
 * Remove the distributable files.
 */
gulp.task('clobber-app', function() {
  return del(DIST_APP_ROOT);
});

gulp.task('clobber-tests', function() {
  return del(DIST_TESTS_ROOT);
});

/**
 * Cleans all created files by this gulpfile, and node_modules.
 */
gulp.task('clean', function() {
  return del([
    DIST_ROOT,
    'node_modules/',
  ]);
});

gulp.task('start-simulators', function() {
  foxboxSimulator = gls(
    `${TESTS_ROOT}foxbox-simulator/http-server.js`, undefined, false
  );
  foxboxSimulator.start();

  registrationServerSimulator = gls(
    `${TESTS_ROOT}registration-server-simulator/http-server.js`, undefined,
    false
  );
  registrationServerSimulator.start();
});

gulp.task('stop-simulators', function() {
  foxboxSimulator.stop();
  registrationServerSimulator.stop();
});

gulp.task('run-unit-tests', function(cb) {
  runSequence('build-unit-tests', function() {
    const Server = require('karma').Server;

    (new Server(
      { configFile: `${__dirname}/karma.conf.js`, singleRun: true }, cb
    )).start();
  });
});

gulp.task('run-test-integration', function() {
  return gulp.src(
    `${TESTS_ROOT}{common,integration}/**/*_test.js`, { read: false }
    )
    .pipe(mocha());
});

gulp.task('test-integration', function(cb) {
  runSequence('start-simulators', 'run-test-integration', () => {
    // Tear down whatever the result is
    runSequence('stop-simulators', cb);
  });
});

gulp.task('run-test-e2e', function() {
  return gulp.src(`${TESTS_ROOT}{common,e2e}/**/*_test.js`, { read: false })
    .pipe(mocha());
});

gulp.task('test', function(cb) {
  runSequence(
    'build',
    'run-unit-tests',
    'webserver',
    'test-integration',
    () => { // Tear down whatever the result is
      runSequence('stop-webserver', cb);
    }
  );
});

// @todo Should be included in 'test' once less manual steps are required.
gulp.task('test-e2e', function() {
  runSequence('build', 'webserver', 'run-test-e2e', 'stop-webserver');
});
