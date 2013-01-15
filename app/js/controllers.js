'use strict';

/* Controllers */


function ServicesCtrl($scope) {
    $scope.list = ['cat','echo','sleep'];
}
ServicesCtrl.$inject = [$scope];


function DataCtrl() {
}
DataCtrl.$inject = [];
