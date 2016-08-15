"use strict";

var gulp = require('gulp'),
    path = require('path'),
    plugins = require('gulp-load-plugins')(),
    gutil = require('gulp-util'),
    watchify = require('watchify'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    del = require('del');

var environment = 'production',
    dest = {
        production: "deploy",
        development: ".tmp"
    };

function destination(p) {
    return path.join(dest[environment], (p || ''));
}

function productionOnly(cb, opts) {
    if (environment === 'production') {
        return cb(opts);
    } else {
        return plugins.util.noop();
    }
}

function developmentOnly(cb, opts) {
    if (environment === 'development') {
        return cb(opts);
    } else {
        return plugins.util.noop();
    }
}

// ---------------------
// Cleanup
// ---------------------

gulp.task('clean', function(cb){
    del([destination()], cb);
});

// ---------------------
// Static files
// ---------------------

gulp.task('pages', function(){
    return gulp.src('src/pages/*.hbs')
        .pipe(plugins.compileHandlebars({},{
            ignorePartials: true,
            batch: ['src/pages/partials']
        }))
        .pipe( plugins.rename({extname: '.html'}))
        .pipe( gulp.dest(destination()) );
});

gulp.task('iconfont', function(){
    return gulp.src(['src/icons/*.svg'])
        .pipe( plugins.iconfont({
            fontName: 'icons', // required
            appendCodepoints: true, // recommended option
            normalize: true
        }))
        .pipe( gulp.dest(destination('media/assets/fonts')) );
});

gulp.task('fonts', function(){
    return gulp.src(['src/fonts/**/*.*'])
        .pipe( gulp.dest(destination('media/assets/fonts')) );
});

gulp.task('docs', function(){
    return gulp.src(['src/docs/**/*.*'])
        .pipe( gulp.dest(destination('media/assets/docs')) );
});

gulp.task('static', function(){
    return gulp.src(['src/static/**/*.*'])
        .pipe( gulp.dest(destination()) );
});

gulp.task('images', function(){
    return gulp.src('src/images/**/*.*')
        .pipe( plugins.imagemin() )
        .pipe( gulp.dest(destination('media/assets/images')) );
});


// ---------------------
// Styles
// ---------------------

gulp.task('styles', function(){
    return gulp.src('src/styles/**/*.scss')
        .pipe( plugins.plumber() )
        .pipe( plugins.sass({ errLogToConsole: true }))
        .pipe( plugins.autoprefixer(['> 1%', 'last 2 versions']) )
        .pipe( productionOnly( plugins.minifyCss ) )
        .pipe( gulp.dest(destination('media/assets/css')) );
});


// ---------------------
// Scripts
// ---------------------

gulp.task('scripts:lint', function(){
    return gulp.src('src/scripts/**/*.js')
        .pipe( plugins.jshint() )
        .pipe( plugins.jshint.reporter('default') );
});

gulp.task('scripts:build', function(){
    var bundler;

    if(environment === 'development') {
        bundler = watchify(browserify('./src/scripts/main.js', watchify.args));
        bundler.on('update', rebundle); // rebundle on update
    } else {
        bundler = browserify('./src/scripts/main.js');
    }

    bundler.transform('jstify', { engine: 'lodash' });

    function rebundle() {
        gutil.log('rebundle');
        return bundler.bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe( source('main.js') )
            .pipe( buffer() )
            .pipe( productionOnly(plugins.uglify) )
            .pipe( gulp.dest(destination('media/assets/js')) );
    }

    return rebundle();
});

// ---------------------
// Development Server
// ---------------------

gulp.task('server', function(){
    gulp.src( destination() )
        .pipe( plugins.webserver({
            host: '0.0.0.0',
            port: 3000,
            livereload: true,
            proxies: [
                { source: '/Service.asmx', target: 'http://staging.etron.service.forms.audi.com.au/Service.asmx' }
            ]
        }));
});

// ---------------------
// User facing tasks
// ---------------------

gulp.task('build', ['static', 'styles', 'images', 'docs', 'iconfont', 'fonts', 'pages', 'scripts:build']);

gulp.task('default', ['clean'], function(){
    return gulp.start('build');
});

gulp.task('dev', function(){
    environment = 'development';

    gulp.start(['default', 'server']);

    gulp.watch('src/images/**/*.*', ['images']);
    gulp.watch('src/styles/**/*.scss', ['styles']);
    // gulp.watch('src/scripts/**/*.*', ['scripts:lint','scripts:build']);
    gulp.watch('src/pages/**/*.hbs', ['pages']);
    gulp.watch('src/icons/*.svg', ['iconfont']);

});
