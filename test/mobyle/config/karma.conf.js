basePath = '../../../mobyle/web/static/app';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'lib/angular/angular.js',
  'lib/angular/angular-*.js',
  '../../../../test/mobyle/test/lib/angular/angular-mocks.js',
  'js/**/*.js',
  'partials/*.html',
  '../../../../test/mobyle/test/unit/**/*.js'
];

// generate js files from html templates
preprocessors = {
    'partials/*.html': 'html2js'
};

autoWatch = true;

browsers = ['Firefox'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};