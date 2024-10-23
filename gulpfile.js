const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');

// Compile SCSS into CSS
gulp.task('css', function() {
  return gulp.src('./scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream());
});

// Minify and concatenate JS
gulp.task('js', function() {
  return gulp.src('./js/*.js')
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browserSync.stream());
});

// Static server + watching scss/js/html files
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: './'
    }
  });
});

// Dev task
gulp.task('dev', gulp.series('css', 'js', 'browserSync', function() {
  gulp.watch('./scss/*.scss', gulp.series('css'));
  gulp.watch('./js/*.js', gulp.series('js'));
  gulp.watch('./*.html').on('change', browserSync.reload);
}));

// Default task
gulp.task('default', gulp.series('dev'));