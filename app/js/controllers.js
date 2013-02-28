'use strict';

/* Controllers */


function ServicesCtrl($scope,$http) {
    $http({
        url: "json/listing.json",
        method: "GET"
    }).success(function(data, status, headers, config) {
        //$scope.services = data['services'].map(
        //    function(name){
        //        return {'name':name};
        //    }
        //);
        $scope.services = data.services;
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}
//ServicesCtrl.$inject = [$scope];

function ServiceDetailCtrl($scope,$http,$routeParams){
    $http({
        url: "json/services/"+$routeParams.serviceId+".json",
        method: "GET"
    }).success(function(data, status, headers, config) {
        $scope.service = data;
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}

function DataCtrl() {
}
//DataCtrl.$inject = [];
