import gulp from 'gulp';
import * as sass from 'sass';
import gulpSass from 'gulp-sass';
import browserSync from 'browser-sync';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import rename from 'gulp-rename';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import fs from 'fs';

// Configurez gulp-sass pour utiliser dart-sass
const sassCompiler = gulpSass(sass);

// Créez une instance de browserSync
const bs = browserSync.create();

// Compile SCSS into CSS
gulp.task('scss', function() {
  console.log('Running SCSS task');
  return gulp.src('./scss/*.scss')
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./css'))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./css'))
    .pipe(bs.stream());
});

// Copy CSS files to dist
gulp.task('css', function() {
  console.log('Running CSS task');
  return gulp.src('./css/*.css')
    .pipe(gulp.dest('./dist/css'))
    .pipe(bs.stream());
});

// Minify and concatenate JS
gulp.task('js', function() {
  console.log('Running JS task');
  return gulp.src('./js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/js'))
    .pipe(bs.stream());
});

// Copy HTML files to dist
gulp.task('html', function() {
  console.log('Running HTML task');
  return gulp.src('./*.html')
    .pipe(gulp.dest('./dist'))
    .pipe(bs.stream());
});

// Copy vendor files to dist
gulp.task('vendor', function() {
  console.log('Running Vendor task');
  return gulp.src('./vendor/**/*')
    .pipe(gulp.dest('./dist/vendor'))
    .pipe(bs.stream());
});

// Copy image files to dist
gulp.task('images', function() {
  console.log('Running Images task');
  return gulp.src('./img/**/*')
    .pipe(gulp.dest('./dist/img'))
    .pipe(bs.stream());
});

// Create _redirects file in dist
gulp.task('redirects', function(done) {
  console.log('Creating _redirects file');
  fs.writeFileSync('./dist/_redirects', '/* /index.html 200');
  done();
});

// Static server + watching scss/js/html files
gulp.task('browserSync', function() {
  bs.init({
    server: {
      baseDir: './dist'
    }
  });
});

// Build task
gulp.task('build', gulp.series('scss', 'css', 'js', 'html', 'vendor', 'images', 'redirects'));

// Dev task
gulp.task('dev', gulp.series('build', 'browserSync', function() {
  gulp.watch('./scss/*.scss', gulp.series('scss', 'css'));
  gulp.watch('./js/*.js', gulp.series('js'));
  gulp.watch('./*.html', gulp.series('html'));
  gulp.watch('./vendor/**/*', gulp.series('vendor'));
  gulp.watch('./img/**/*', gulp.series('images'));
  gulp.watch('./dist/*.html').on('change', bs.reload);
}));

// Default task
gulp.task('default', gulp.series('dev'));