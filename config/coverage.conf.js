basePath = '../';

files = [
    JASMINE,
    JASMINE_ADAPTER,
    'app/lib/angular/angular.js',
    'app/lib/angular/angular-*.js',
    'test/lib/angular/angular-mocks.js',
    'app/js/**/*.js',
    'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Firefox'];

junitReporter = {
    outputFile: 'test_out/unit.xml',
    suite: 'unit'
};

// code coverage configuration

preprocessors = {
    'app/js/**/*.js': 'coverage'
};

reporters = ['coverage'];

coverageReporter = {
    type : 'html',
    dir : 'coverage/'
}
