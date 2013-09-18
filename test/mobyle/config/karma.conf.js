module.exports = function(config) {
  config.set({
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

    exclude: ['lib/angular/angular-scenario.js'],

    // generate js files from html templates
    preprocessors: {
        'partials/*.html': 'ng-html2js'
    },

    autoWatch: true,

    browsers: ['Chrome'],

    plugins: [
        'karma-junit-reporter',
        'karma-jasmine',
        'karma-chrome-launcher',
        'karma-firefox-launcher',
        'karma-ng-html2js-preprocessor'
    ],

    junitReporter : {
        outputFile: 'test_out/unit.xml',
        suite: 'unit'
    }

  });
};
