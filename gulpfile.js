var gulp = require('gulp');
var paths = {
    templates : ["templates/*"],
    scripts : ["assets/scripts/*"]
}

gulp.task('tempsToPublic', function() {
  gulp.src(paths.templates).pipe(gulp.dest('public/templates'));
});

gulp.task('scriptsToPublic', function() {
  gulp.src(paths.scripts).pipe(gulp.dest('public/assets/scripts'));
});

gulp.task('indexToPublic', function() {
  gulp.src('index.html').pipe(gulp.dest('public'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.templates, ['tempsToPublic']);
  gulp.watch(paths.scripts, ['scriptsToPublic']);
  gulp.watch('index.html', ['indexToPublic']);
});

gulp.task('default', ['watch']);
