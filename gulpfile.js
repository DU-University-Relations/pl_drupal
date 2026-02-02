'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const replace = require('gulp-replace');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

const config = {
    src: './scss/style.scss',  // Only compile the main file, not all scss files
    css: {
        loadPaths: [
            './node_modules'
        ]
    }
};

gulp.task('sass-dev', function () {
  return gulp.src(config.src)
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass({
      loadPaths: config.css.loadPaths,
      quietDeps: true,
      silenceDeprecations: ['import'],
    }).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dest'));
});

gulp.task('sass', function (done) {
  // Compile Foundation framework
  gulp.src('./scss/foundation.scss')
    .pipe(sass({
      loadPaths: config.css.loadPaths,
      quietDeps: true,
      silenceDeprecations: ['import'],
    }).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      cssnano()
    ]))
    .pipe(gulp.dest('dest'));

  // Compile DU custom styles
  gulp.src('./scss/style.scss')
    .pipe(sassGlob())
    .pipe(sass({
      loadPaths: config.css.loadPaths,
      quietDeps: true,
      silenceDeprecations: ['import'],
    }).on('error', sass.logError))
    .pipe(replace(/\/\*[\s\S]*?\*\//g, function(match, offset, string) {
      // Keep only the first CSS comment block (typically the license header)
      // Strip all subsequent comments
      const firstCommentEnd = string.indexOf('*/') + 2;
      if (offset < firstCommentEnd) {
        return match; // Keep first comment
      }
      return ''; // Remove all other comments
    }))
    .pipe(replace(/\n\s*\n\s*\n+/g, '\n\n')) // Reduce multiple blank lines to max 1
    .pipe(replace(
      /(\.column, \.columns[^{]*\{)\s*flex:\s*1\s+1\s+0px;/g,
      '$1\n  /* flex: 1 1 0px; */'
    )) // Comment out flex definition for .column, .columns selector
    .pipe(postcss([
      autoprefixer(),
      cssnano()
    ]))
    .pipe(gulp.dest('dest'))
    .on('end', done);
});

gulp.task('copy-libs', function (done) {
  // Foundation Sites
  gulp.src('./node_modules/foundation-sites/dist/js/foundation.min.js')
    .pipe(gulp.dest('dest/libraries/foundation-sites/dist/js'));

  // Motion UI
  gulp.src('./node_modules/motion-ui/dist/motion-ui.min.*')
    .pipe(gulp.dest('dest/libraries/motion-ui/dist'));

  // Slick Carousel
  gulp.src([
    './node_modules/slick-carousel/slick/slick.min.js',
    './node_modules/slick-carousel/slick/slick.css'
  ])
    .pipe(gulp.dest('dest/libraries/slick-carousel/slick'));

  // Isotope Layout
  gulp.src('./node_modules/isotope-layout/dist/isotope.pkgd.min.js')
    .pipe(gulp.dest('dest/libraries/isotope-layout/dist'));

  // jQuery scrollTo
  gulp.src('./node_modules/jquery.scrollto/jquery.scrollTo.min.js')
    .pipe(gulp.dest('dest/libraries/jquery.scrollto'));

  // Clipboard.js
  gulp.src('./node_modules/clipboard/dist/clipboard.min.js')
    .pipe(gulp.dest('dest/libraries/clipboard/dist'));

  done();
});

gulp.task('copy-images', function () {
  return gulp.src('./images/**/*')
    .pipe(gulp.dest('dest/images'));
});

gulp.task('build', gulp.series('copy-libs', 'copy-images', 'sass'));

gulp.task('watch', function () {
    gulp.watch(['du-resources/**/*.scss', 'scss/**/*.scss'], gulp.series('sass-dev'));
});

gulp.task('default', gulp.series('build'));


