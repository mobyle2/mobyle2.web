module.exports = function(config) {
  config.set({
    basePath: '../../../mobyle/web/static/app',

    frameworks: ["jasmine"],

    files: [
      'lib/angular/angular.js',
      'lib/angular/angular-*.js',
      'js/**/*.js',
      'partials/*.html',
      '../../../../test/mobyle/test/unit/**/*.js'
    ],

    exclude: ['lib/angular/angular-scenario.js'],

    preprocessors: {
        // generate js files from html templates
        'partials/*.html': 'ng-html2js'
    },

    autoWatch: true,

    browsers: ['PhantomJS'],

    plugins: [
        'karma-junit-reporter',
        'karma-jasmine',
        'karma-phantomjs-launcher',
        'karma-ng-html2js-preprocessor'
    ]

  });
};
