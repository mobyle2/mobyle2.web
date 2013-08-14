module.exports = function(karma) {
  karma.configure({
    basePath: '../../../mobyle/web/static/app',

    frameworks: ["jasmine"],

    files: [
      'lib/angular/angular.js',
      'lib/angular/angular-*.js',
      '../../../../test/mobyle/test/lib/angular/angular-mocks.js',
      'js/**/*.js',
      'partials/*.html',
      '../../../../test/mobyle/test/unit/**/*.js'
    ],

    // generate js files from html templates
    preprocessors: {
        'partials/*.html': 'ng-html2js'
    },

    autoWatch: true,

    browsers: ['Firefox'],

    junitReporter: {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }
 });
};
