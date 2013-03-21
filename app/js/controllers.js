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
        $scope.listDisplay = 'list'
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}
//ServicesCtrl.$inject = [$scope];

function ServiceDetailCtrl($scope,$http,$routeParams,mbsimple){
    $http({
        url: "json/services/"+$routeParams.serviceId+".json",
        method: "GET"
    }).success(function(data, status, headers, config) {
        $scope.service = data;
        $scope.mbsimple = mbsimple;
        $scope.show_advanced = !mbsimple($scope.service.inputs);
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}

function DataCtrl() {
}
//DataCtrl.$inject = [];
