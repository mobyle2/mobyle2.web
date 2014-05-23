'use strict';


// Declare app level module which depends on filters, and services
angular.module('mobyle', ['mobyle.filters', 'mobyle.services', 'mobyle.directives', 'mobyle.controllers', 'ngSanitize', 'ngRoute', 'ui.utils', 'ui.tinymce', 'ui.bootstrap', 'ngGrid']).
config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/services', {
            templateUrl: 'views/services.html',
            controller: 'ServicesCtrl'
        });
        var serviceDetailRoute = {
            templateUrl: 'views/serviceDetail.html',
            controller: 'ServiceDetailCtrl',
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
        };
        $routeProvider.when('/services/:name/:version?', serviceDetailRoute);
        $routeProvider.when('/projects/:project/services/:name/:version?', serviceDetailRoute);
        $routeProvider.when('/projects', {
            templateUrl: 'views/projects.html',
            controller: 'ProjectsCtrl'
        });
        $routeProvider.when('/projects/:projectId', {
            templateUrl: 'views/projectDetail.html',
            controller: 'ProjectDetailCtrl'
        });
        $routeProvider.when('/jobs', {
            templateUrl: 'views/jobs.html',
            controller: 'JobsCtrl'
        });
        var jobDetailRoute = {
            templateUrl: 'views/jobDetail.html',
            controller: 'JobDetailCtrl',
            resolve: {
                job: function ($route, Job, $q) {
                    var deferred = $q.defer();
                    Job.get({id: $route.current.params.jobId
                    }, function (successData) {
                        deferred.resolve(successData);
                    }, function (errorData) {
                        deferred.reject('job ' + $route.current.params.jobId + ' not found!');
                    });
                    return deferred.promise;
                }
            }
        };
        $routeProvider.when('/jobs/:jobId', jobDetailRoute);
        $routeProvider.when('/dataterms', {
            templateUrl: 'views/terms.html',
            controller: 'DataTermsCtrl'
        });
        $routeProvider.when('/dataterms/:dataTermId', {
            templateUrl: 'views/termDetail.html',
            controller: 'DataTermDetailCtrl'
        });
        $routeProvider.when('/formatterms', {
            templateUrl: 'views/terms.html',
            controller: 'FormatTermsCtrl'
        });
        $routeProvider.when('/formatterms/:formatTermId', {
            templateUrl: 'views/termDetail.html',
            controller: 'FormatTermDetailCtrl'
        });
        $routeProvider.when('/login', {
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/logout', {
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/my', {
            templateUrl: 'views/my.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/my/password_reset', {
            templateUrl: 'views/my_password_reset.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/dashboard', {
            templateUrl: 'views/my.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/notificationcenter', {
            templateUrl: 'views/notificationcenter.html',
            controller: 'NotificationCenterCtrl'
        });
        $routeProvider.otherwise({
            redirectTo: '/services'
        });
  }]);