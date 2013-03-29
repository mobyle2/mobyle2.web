'use strict';

/* Controllers */


function ServicesCtrl($scope,Service) {
    $scope.services = Service.query();
    $scope.listDisplay = 'list';
}

function ServiceDetailCtrl($scope,$routeParams,mbsimple,Service,$resource){
    $scope.service = Service.get({id:$routeParams.serviceId});
    $scope.mbsimple = mbsimple;
}

function DataCtrl() {
}
