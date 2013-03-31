'use strict';


// Declare app level module which depends on filters, and services
angular.module('awa', ['awa.filters', 'awa.services', 'awa.directives', 'ngSanitize', 'ui', 'ui.bootstrap']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/services', {templateUrl: 'partials/services.html', controller: ServicesCtrl});
    $routeProvider.when('/services/:serviceId', {templateUrl: 'partials/serviceDetail.html', controller: ServiceDetailCtrl});
    $routeProvider.when('/projects', {templateUrl: 'partials/projects.html', controller: ProjectsCtrl});
    $routeProvider.when('/projects/:projectId', {templateUrl: 'partials/projectDetail.html', controller: ProjectDetailCtrl});
    $routeProvider.when('/data', {templateUrl: 'partials/data.html', controller: DataCtrl});
    $routeProvider.otherwise({redirectTo: '/services'});
  }]);

