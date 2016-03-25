/**
 * IMPORTANT: This file is installed into the app directory as part of the
 * npm install fxos-build process. Please do not try to modify this file
 * or create additional build steps without checking with the team first.
 *
 * For any build system feature requests or bugs, please open
 * an issue in the fxos-build project: https://github.com/fxos/build/issues
 */

var gulp = require('gulp');

var buildModules = __dirname + '/node_modules/fxos-build/node_modules/';
var concat = require(buildModules + 'gulp-concat');
var babel = require(buildModules + 'gulp-babel');
var rename = require('gulp-rename');
var jshint = require(buildModules + 'gulp-jshint');
var zip = require(buildModules + 'gulp-zip');
var del = require(buildModules + 'del');
var runSequence = require(buildModules + 'run-sequence').use(gulp);
var webserver = require(buildModules + 'gulp-webserver');
var exec = require('child_process').exec;
var mocha = require('gulp-mocha');
var gls = require('gulp-live-server');
var gsww = require('gulp-sww');

const APP_ROOT = './app/';
const DIST_ROOT = './dist/';
const DIST_APP_ROOT = './dist/app/';

var webserverStream;
var foxboxSimulator;
var registrationServerSimulator;

/**
 * runs jslint on all javascript files found in the app dir.
 */
gulp.task('lint', function() {
  // Note: To have the process exit with an error code (1) on
  //  lint error, return the stream and pipe to failOnError last.
  return gulp.src([
      './app/js/**/*.js',
      '!./app/js/components/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

/**
 * copies necessary files for the Babel amd loader to the app.
 */
gulp.task('loader-polyfill', function() {
  return gulp.src(['./node_modules/fxos-build/app_files/loader_polyfill/*.js'])
    .pipe(concat('initapp.js'))
    .pipe(gulp.dest(DIST_APP_ROOT + 'js'));
});

/**
 * Copy all non-js directory app source/assets/components.
 */
gulp.task('copy-app', function() {
  return gulp.src([
      APP_ROOT + '**',
      '!' + APP_ROOT + 'js/**/*.js' // do not copy js
    ])
    .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * converts javascript to es5. this allows us to use harmony classes and modules.
 */
gulp.task('babel', function() {
  var files = [
    APP_ROOT + 'js/**/*.js',
    APP_ROOT + 'js/**/*.jsx'
  ];

  try {
    return gulp.src(files)
      .pipe(babel().on('error', function(e) {
          console.log('error running Babel', e);
        })
      )
      .pipe(gulp.dest(DIST_APP_ROOT + 'js/'));
  } catch (e) {
    console.log('Got error in Babel', e);
  }
});

gulp.task('remove-useless', function(cb) {
  del([
    DIST_APP_ROOT + 'js/**/*.jsx',
    DIST_APP_ROOT + '**/*.md'
  ], cb);
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
 * Runs travis tests
 */
gulp.task('travis', ['lint', 'loader-polyfill', 'babel']);

/**
 * Build the app.
 */
gulp.task('build', function(cb) {
  runSequence(['clobber'], ['loader-polyfill', 'copy-app'], ['babel'],
    ['lint'], ['remove-useless'], cb);
});

/**
 * Cordova tasks:
 */

function addTask(name, dir, cmds) {
  gulp.task(name, function(cb) {
    process.chdir(dir);
    function nextCmd() {
      var cmd = cmds.shift();
      exec(cmd, function(err, stdout, stderr) {
        if (stdout.length) {
          console.log(stdout);
        }
        if (stderr.length) {
          console.error(stderr);
        }
        if (err) {
          return cb(err);
        }
        if (cmds.length) {
          nextCmd();
        } else {
          cb();
        }
      });
    }

    nextCmd();
  });
}

addTask('cordova-create', 'dist', [
  'cordova create cordova',
  'rm -r cordova/www/*',
  'cp -r app/* cordova/www/'
]);

gulp.task('cordova-setup', function(cb) {
  runSequence(['build'], ['cordova-create'], cb);
});

addTask('cordova-android', 'dist/cordova', [
  'cordova plugin add https://github.com/michielbdejong/SecureHTTP.git',
  'cordova plugin add phonegap-plugin-barcodescanner',
  'cordova platform add android@5.1.0',
  'cordova build android',
  'cordova run android'
]);

/**
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', function() {
  gulp.watch([APP_ROOT + '**'], ['build']);
});

gulp.task('webserver', function() {
  webserverStream = gulp.src('dist/app')
    .pipe(webserver({
      port: process.env.PORT || 8000,
      host: process.env.HOSTNAME || 'localhost',
      livereload: false,
      directoryListing: false,
      open: false
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
gulp.task('clobber', function(cb) {
  del('dist/', cb);
});

/**
 * Add ServiceWorker support and cache all application
 * assets.
 */
gulp.task('offline', ['build'], function() {
  gulp.src(['**/*'], { cwd: DIST_APP_ROOT })
    .pipe(gsww())
    .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Cleans all created files by this gulpfile, and node_modules.
 */
gulp.task('clean', function(cb) {
  del([
    '.bowerrc',
    '.editorconfig',
    '.git/hooks/pre-commit',
    '.jshintrc',
    'dist/',
    'app/components',
    'node_modules/',
    'gulpfile.js'
  ], cb);
});

gulp.task('start-simulators', function() {
  foxboxSimulator = gls('tests/foxbox-simulator/http-server.js', undefined, false);
  foxboxSimulator.start();

  registrationServerSimulator = gls('tests/registration-server-simulator/http-server.js', undefined, false);
  registrationServerSimulator.start();
});

gulp.task('stop-simulators', function() {
  foxboxSimulator.stop();
  registrationServerSimulator.stop();
});

gulp.task('run-test-integration', function() {
  return gulp.src('./tests/{common,integration}/**/*_test.js', { read: false }).pipe(mocha());
});


gulp.task('test-integration', function(cb) {
  return runSequence('start-simulators', 'run-test-integration', 'stop-simulators', cb);
});

gulp.task('run-test-e2e', function() {
  return gulp.src('./tests/{common,e2e}/**/*_test.js', { read: false }).pipe(mocha());
});

gulp.task('test', function() {
  runSequence('build', 'webserver', 'test-integration', 'stop-webserver');
});

// TODO: Should be included in 'test' once less manual steps are required
gulp.task('test-e2e', function() {
  runSequence('build', 'webserver', 'run-test-e2e', 'stop-webserver');
});
