'use strict';


// Declare app level module which depends on filters, and services
angular.module('awa', ['awa.filters', 'awa.services', 'awa.directives', 'ngSanitize', 'ui', 'ui.bootstrap']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/services', {templateUrl: 'partials/services.html', controller: ServicesCtrl});
    $routeProvider.when('/services/:serviceId', {templateUrl: 'partials/serviceDetail.html', controller: ServiceDetailCtrl});
    $routeProvider.when('/projects', {templateUrl: 'partials/projects.html', controller: ProjectsCtrl});
    $routeProvider.when('/projects/:projectId', {templateUrl: 'partials/projectDetail.html', controller: ProjectDetailCtrl});
    $routeProvider.when('/types', {templateUrl: 'partials/types.html', controller: TypesCtrl});
    $routeProvider.when('/types/:typeId', {templateUrl: 'partials/typeDetail.html', controller: TypeDetailCtrl});
    $routeProvider.when('/formats', {templateUrl: 'partials/formats.html', controller: FormatsCtrl});
    $routeProvider.when('/formats/:formatId', {templateUrl: 'partials/formatDetail.html', controller: FormatDetailCtrl});
    $routeProvider.when('/data', {templateUrl: 'partials/data.html', controller: DataCtrl});
    $routeProvider.when('/login', {templateUrl: 'partials/login.html',controller: LoginCtrl});
    $routeProvider.when('/logout', {templateUrl: 'partials/login.html',controller: LoginCtrl});
    $routeProvider.when('/my', {templateUrl: 'partials/my.html',controller: LoginCtrl});
    $routeProvider.when('/my/password_reset', {templateUrl: 'partials/my_password_reset.html',controller: LoginCtrl});
    $routeProvider.when('/dashboard', {templateUrl: 'partials/my.html',controller: LoginCtrl});
    $routeProvider.otherwise({redirectTo: '/services'});
  }]);

