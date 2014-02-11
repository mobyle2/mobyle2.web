'use strict';


// Declare app level module which depends on filters, and services
angular.module('mobyle', ['mobyle.filters', 'mobyle.services', 'mobyle.directives', 'ngSanitize', 'ngRoute', 'ui', 'ui.tinymce', 'ui.bootstrap', 'ngGrid']).
config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/services', {
            templateUrl: 'partials/services.html',
            controller: ServicesCtrl
        });
        $routeProvider.when('/services/:name/:version', {
            templateUrl: 'partials/serviceDetail.html',
            controller: ServiceDetailCtrl,
            resolve: {
                service: function ($route, Service, $q) {
                    var deferred = $q.defer();
                    Service.get({
                        public_name: $route.current.params.name
                    }, function (successData) {
                        deferred.resolve(successData);
                    }, function (errorData) {
                        deferred.reject('service ' + $route.current.params.name + ' not found!');
                    });
                    return deferred.promise;
                }
            }
        });
        $routeProvider.when('/projects/:project/services/:name/:version', {
            templateUrl: 'partials/serviceDetail.html',
            controller: ServiceDetailCtrl
        });
        $routeProvider.when('/projects', {
            templateUrl: 'partials/projects.html',
            controller: ProjectsCtrl
        });
        $routeProvider.when('/projects/:projectId', {
            templateUrl: 'partials/projectDetail.html',
            controller: ProjectDetailCtrl
        });
        $routeProvider.when('/dataterms', {
            templateUrl: 'partials/terms.html',
            controller: DataTermsCtrl
        });
        $routeProvider.when('/dataterms/:dataTermId', {
            templateUrl: 'partials/termDetail.html',
            controller: DataTermDetailCtrl
        });
        $routeProvider.when('/formatterms', {
            templateUrl: 'partials/terms.html',
            controller: FormatTermsCtrl
        });
        $routeProvider.when('/formatterms/:formatTermId', {
            templateUrl: 'partials/termDetail.html',
            controller: FormatTermDetailCtrl
        });
        $routeProvider.when('/data', {
            templateUrl: 'partials/data.html',
            controller: DataCtrl
        });
        $routeProvider.when('/login', {
            templateUrl: 'partials/login.html',
            controller: LoginCtrl
        });
        $routeProvider.when('/logout', {
            templateUrl: 'partials/login.html',
            controller: LoginCtrl
        });
        $routeProvider.when('/my', {
            templateUrl: 'partials/my.html',
            controller: LoginCtrl
        });
        $routeProvider.when('/my/password_reset', {
            templateUrl: 'partials/my_password_reset.html',
            controller: LoginCtrl
        });
        $routeProvider.when('/dashboard', {
            templateUrl: 'partials/my.html',
            controller: LoginCtrl
        });
        $routeProvider.otherwise({
            redirectTo: '/services'
        });
  }]);