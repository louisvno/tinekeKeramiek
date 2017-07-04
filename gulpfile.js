var gulp = require('gulp');
var del = require('del');
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');

var srcPaths = {
    scripts : ["assets/scripts/*"],
    styles: ["assets/styles/*"]
}

var pubPaths = {
    scripts : "public/assets/scripts",
    styles: "public/assets/styles",
    public: "public"
}

gulp.task('scriptsToPublic', function() {
  gulp.src(srcPaths.scripts)
      .pipe(uglify())
      .pipe(gulp.dest(pubPaths.scripts));
});

gulp.task('htmlToPublic', function() {
  gulp.src('index.html').pipe(gulp.dest(pubPaths.public));
  gulp.src('admin.html').pipe(gulp.dest(pubPaths.public));
});

gulp.task('cssToPublic', function() {
  gulp.src(srcPaths.styles)
      .pipe(cleanCSS())
      .pipe(gulp.dest(pubPaths.styles));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(srcPaths.scripts, ['scriptsToPublic']);
  gulp.watch('*.html', ['htmlToPublic']);
});

gulp.task('publish',['cleanPub','scriptsToPublic','htmlToPublic', 'cssToPublic'])

gulp.task('cleanPub', function(){
    return del([
       pubPaths.scripts +"/*",
       pubPaths.styles + "/*",
       pubPaths.public + "/*.html"
    ])
});

gulp.task('default', ['watch']);