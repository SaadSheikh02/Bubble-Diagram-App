const gulp = require('gulp');


gulp.task('views', () => {
  return gulp
    .src('src/views/**')
    .pipe(gulp.dest('dist/views'));
});

gulp.task('lib', () => {
  return gulp
    .src('src/lib/**')
    .pipe(gulp.dest('dist/lib'));
});

gulp.task('default', gulp.parallel('views'), gulp.parallel('lib'));