'use strict';

var gulp        = require('gulp');
var gutil       = require('gulp-util');
var eslint      = require('gulp-eslint');
var sass        = require('gulp-sass');
var babel       = require('gulp-babel');
var sourcemaps  = require('gulp-sourcemaps');
var concat      = require('gulp-concat');
var uglify      = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var del         = require('del');
var Server      = require('karma').Server;

var source = {
    html: 'source/*.html',
    js: 'source/js/*.js',
    scss: 'source/scss/**/*.scss'
};

var dest = {
    root: 'public',
    js: 'public/js',
    css: 'public/css'
};

gulp.task('default', ['build-dev']);
gulp.task('build-dev', ['html', 'sass', 'js']);

gulp.task('clean', function() {
    return del([dest.root]);
});

gulp.task('eslint', function() {
    return gulp.src(source.js)
        .pipe(eslint({
            "extends": "eslint:recommended",
            "env": {
                "browser": true
            },
            "parserOptions": {
                "ecmaVersion": 6,
                "sourceType": "module",
                "ecmaFeatures": {
                    "jsx": true
                }
            },
            "rules": {
                "semi": 2
            }
        }))
        .pipe(eslint.format());
});

gulp.task('js',function() {
    return gulp.src(source.js)
        .pipe(sourcemaps.init())
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(concat('bundle.js'))
            //.pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dest.js))
        .pipe(browserSync.stream());
});

gulp.task('sass', function() {
    return gulp.src(source.scss)
        .pipe(sourcemaps.init())
            .pipe(sass())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dest.css))
        .pipe(browserSync.stream());
});

gulp.task('html', function() {
    return gulp.src(source.html)
        .pipe(gulp.dest(dest.root))
        .pipe(browserSync.stream());
});

gulp.task('serve', ['build-dev'], function() {

    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });

    gulp.watch(source.scss, ['sass']);
    gulp.watch(source.js, ['js']);
    gulp.watch(source.html, ['html']);
});

gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('tdd', function (done) {
    new Server({
        configFile: __dirname + '/karma.conf.js'
    }, done).start();
});
