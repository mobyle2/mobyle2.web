'use strict';

/* Controllers */


function ServicesCtrl($scope,Service) {
    $scope.services = Service.query();
    $scope.listDisplay = 'list';
}

function ServiceDetailCtrl($scope,$routeParams,mbsimple,Service){
    Service.get({id:$routeParams.serviceId}, function(data){
        $scope.service = data.service;
    });
    $scope.mbsimple = mbsimple;
}

function DataCtrl() {
}
