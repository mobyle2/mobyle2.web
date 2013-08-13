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

    autoWatch: true,

    browsers: ['Firefox'],

    junitReporter: {
        outputFile: 'test_out/unit.xml',
        suite: 'unit'
    },

    preprocessors: {
        // generate js files from html templates
        'partials/*.html': 'html2js',
        // code coverage configuration
        'js/**/*.js': 'coverage'
    },

    reporters: ['coverage'],

    coverageReporter: {
        type : 'html',
        dir : 'coverage/'
    }
  });
};

