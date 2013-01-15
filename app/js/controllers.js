'use strict';

/* Controllers */


function ServicesCtrl($scope,$http) {
    $http({
        url: "json/listing.json",
        method: "GET"
    }).success(function(data, status, headers, config) {
        $scope.services = data['services'];
    }).error(function(data, status, headers, config) {
        $scope.status = status;
    });
}
//ServicesCtrl.$inject = [$scope];


function DataCtrl() {
}
//DataCtrl.$inject = [];
