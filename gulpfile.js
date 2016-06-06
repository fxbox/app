/* eslint-env node */

'use strict';

const gulp = require('gulp');

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
const esdoc = require('gulp-esdoc');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const merge = require('merge2');
const rollup = require('gulp-rollup');
const rollupBabelPlugin = require('rollup-plugin-babel');
const rollupIncludePathsPlugin = require('rollup-plugin-includepaths');
const rollupUglifyPlugin = require('rollup-plugin-uglify');
const minifier = require('gulp-uglify/minifier');
const uglifyjs = require('uglify-js');

const APP_ROOT = './app/';
const TESTS_ROOT = './tests/';
const DOC_ROOT = './doc/';

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
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('copy-app-common', function() {
  return merge(
    gulp.src([
      `${APP_ROOT}**`,
      // Don't copy documentation files.
      `!${APP_ROOT}**/*.md`,
      // Don't copy JS, it will be compiled and copied on the compile step.
      `!${APP_ROOT}js/**`,
    ]),

    // Module loader.
    gulp.src('./node_modules/alameda/alameda.js')
      .pipe(rename('js/alameda.js')),

    // Components.
    gulp.src('./node_modules/fxos-mvc/dist/mvc.js')
      .pipe(rename('js/components/mvc.js')),

    // Polyfills.
    gulp.src('./node_modules/whatwg-fetch/fetch.js')
      .pipe(rename('js/polyfills/fetch.js'))
  )
  .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Copy all required app resources/assets/external components to be used in
 * development build.
 */
gulp.task('copy-app-dev', ['copy-app-common'], function() {
  return merge(
    // Components.
    gulp.src('./node_modules/react/dist/react.js')
      .pipe(rename('js/components/react.js')),
    gulp.src('./node_modules/react-dom/dist/react-dom.js')
      .pipe(rename('js/components/react-dom.js')),

    // Polyfills.
    gulp.src('./node_modules/url-search-params/build/url-search-params.max.js')
      .pipe(rename('js/polyfills/url-search-params.js'))
  )
  .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Copy all required app resources/assets/external components to be used in
 * production build.
 */
gulp.task('copy-app-production', ['copy-app-common'], function() {
  return merge(
    // Components.
    gulp.src('./node_modules/react/dist/react.min.js')
      .pipe(rename('js/components/react.js')),
    gulp.src('./node_modules/react-dom/dist/react-dom.min.js')
      .pipe(rename('js/components/react-dom.js')),

    // Polyfills.
    gulp.src('./node_modules/url-search-params/build/url-search-params.js')
      .pipe(rename('js/polyfills/url-search-params.js'))
  )
  .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Compiles app source i.e. processes source with Babel and Rollup.
 */
gulp.task('compile-app-dev', function() {
  return gulp
    .src(`${APP_ROOT}js/*.js`)
    .pipe(
      rollup({
        sourceMap: true,
        format: 'amd',
        external: [
          'components/mvc',
          'components/react',
          'components/react-dom',
        ],
        plugins: [
          rollupBabelPlugin(),
          rollupIncludePathsPlugin({ extensions: ['.js', '.jsx'] }),
        ],
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${DIST_APP_ROOT}js`));
});

/**
 * Compiles app source for production i.e. processes source with Babel, Rollup
 * and UglifyJS.
 */
gulp.task('compile-app-production', ['compress-external-modules'], function() {
  return gulp
    .src(`${APP_ROOT}js/*.js`)
    .pipe(
      rollup({
        sourceMap: true,
        format: 'amd',
        external: [
          'components/mvc',
          'components/react',
          'components/react-dom',
        ],
        plugins: [
          rollupBabelPlugin(),
          rollupUglifyPlugin({ sourceMap: true }, uglifyjs.minifier),
          rollupIncludePathsPlugin({ extensions: ['.js', '.jsx'] }),
        ],
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${DIST_APP_ROOT}js`));
});

/**
 * Compresses external modules that don't provide compressed version.
 */
gulp.task('compress-external-modules', function() {
  return gulp
    .src([
      `${DIST_APP_ROOT}js/alameda.js`,
      `${DIST_APP_ROOT}js/components/mvc.js`,
      `${DIST_APP_ROOT}js/polyfills/fetch.js`,
    ], { base: DIST_APP_ROOT })
    .pipe(sourcemaps.init())
    .pipe(minifier({}, uglifyjs))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(DIST_APP_ROOT));
});

/**
 * Applies Babel transform to the app/tests JS and JSX files. The only
 * difference between normal app build and build for unit tests is that Rollup
 * is not used here.
 */
gulp.task('compile-unit-tests', function() {
  process.env.BABEL_ENV = 'test';

  return gulp
    .src([`${APP_ROOT}js/**/*.{js,jsx}`, `${TESTS_ROOT}unit/**/*.js`])
    .pipe(babel())
    .pipe(gulp.dest(`${DIST_TESTS_ROOT}unit/`));
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
 * Builds the app for development.
 */
gulp.task('build-dev', function(cb) {
  process.env.BABEL_ENV = 'development';

  runSequence(
    'lint', 'clobber-app', 'copy-app-dev', 'compile-app-dev',
    'offline', cb
  );
});

/**
 * Builds the app for the production.
 */
gulp.task('build-production', function(cb) {
  process.env.BABEL_ENV = 'production';

  runSequence(
    'lint', 'clobber-app', 'copy-app-production', 'compile-app-production',
    'offline', cb
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
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', function() {
  gulp.watch([`${APP_ROOT}**`], ['build-dev']);
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
gulp.task('default', function(cb) {
  runSequence('build-dev', 'webserver', 'watch', cb);
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

gulp.task('clobber-doc', function() {
  return del(DOC_ROOT);
});

/**
 * Cleans all created files by this gulpfile, and node_modules.
 */
gulp.task('clean', function() {
  return del([
    DIST_ROOT,
    DOC_ROOT,
    'node_modules/',
  ]);
});

/**
 * Generate documentation from the code.
 */
gulp.task('generate-doc', function() {
  return gulp.src(`${APP_ROOT}js/lib/foxbox/`)
    .pipe(esdoc({
      destination: DOC_ROOT,
      title: 'Project Link web app',
      test: {
        type: 'mocha',
        source: TESTS_ROOT,
      },
    }));
});

gulp.task('copy-doc-badge', function() {
  return gulp.src(`${DOC_ROOT}badge.svg`)
    .pipe(gulp.dest('./assets/'));
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

gulp.task('run-unit-tests', ['compile-unit-tests'], function(cb) {
  const server = new (require('karma').Server)(
    { configFile: `${__dirname}/karma.conf.js`}, cb
  );

  server.start();
});

gulp.task('run-test-integration', function() {
  return gulp.src(
    `${TESTS_ROOT}{common,integration}/**/*_test.js`, { read: false }
    )
    .pipe(mocha());
});

gulp.task('doc', function() {
  runSequence(['clobber-doc'], ['generate-doc'], ['copy-doc-badge']);
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

gulp.task('test', ['clobber-tests', 'build-production'], function(cb) {
  runSequence(
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
  runSequence(
    'build-production',
    'webserver',
    'run-test-e2e',
    'stop-webserver'
  );
});
