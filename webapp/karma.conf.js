module.exports = function(config) {
  config.set({
    basePath: 'app',

    frameworks: ["jasmine"],

    files: [
      'bower_components/tinymce/tinymce.min.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',        
      'bower_components/ng-grid/build/ng-grid.min.js',
      'bower_components/angular-ui-tinymce/src/tinymce.js',
      'bower_components/bootstrap/docs/assets/js/bootstrap.js',
      'bower_components/angular-ui/build/angular-ui.js',
      'scripts/*.js',
      'views/*.html',
      '../test/spec/*.js'
    ],

    exclude: ['bower_components/angular-scenario/angular-scenario.js'],

    preprocessors: {
        // generate js files from html templates
        'views/*.html': 'ng-html2js'
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
