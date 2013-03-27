'use strict';

/* Controllers */


function ServicesCtrl($scope,$http) {
    $http({
        url: "/api/services/",
        method: "GET"
    }).success(function(data, status, headers, config) {
        $scope.services = data;
        $scope.listDisplay = 'list'
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}

function ServiceDetailCtrl($scope,$http,$routeParams,mbsimple){
    $http({
        url: "/api/services/"+$routeParams.serviceId,
        method: "GET"
    }).success(function(data, status, headers, config) {
        $scope.service = data.service;
        $scope.mbsimple = mbsimple;
        $scope.show_advanced = !mbsimple($scope.service.inputs);
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}

function DataCtrl() {
}
