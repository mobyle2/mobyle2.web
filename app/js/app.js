'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/services', {templateUrl: 'partials/services.html', controller: ServicesCtrl});
    $routeProvider.when('/services/:serviceId', {templateUrl: 'partials/serviceDetail.html', controller: ServiceDetailCtrl});
    $routeProvider.when('/data', {templateUrl: 'partials/data.html', controller: DataCtrl});
    $routeProvider.otherwise({redirectTo: '/services'});
  }]);
