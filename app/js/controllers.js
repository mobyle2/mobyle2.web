'use strict';

/* Controllers */

function UserCtrl($scope) {

}

function LoginCtrl($scope, $location) {
    $scope.logins = ['native', 'facebook', 'openid', 'twitter', 'github', 'persona' ];
    //$scope.persona = Login.get('persona', {assertion:"XXX"});
    $scope.User = null;
    $scope.loginUser = null;
    $scope.loginPassword = null;

    $scope.provider = 'native';

    $scope.isProvider = function(type) {
        return type == $scope.provider;
    }

    $scope.setUser = function(user) {
        $scope.User = user;
        if($location.path() == '/login') {
            $location.path('/');
        }
    }
    $scope.userLogged = function() {
        return $scope.User!=null;
    }

    $scope.signIn = function(type) {
        $scope.provider = type;
        if(type == 'persona') {
            navigator.id.request();
        }
        else if (type == 'mobyle') {
            $scope.loginUser = null;
            $scope.loginPassword = null;

        }
    }

    $scope.signOut = function() {
        if($scope.provider == 'persona') {
            navigator.id.logout();
        }
        $scope.setUser(null);
        $scope.provider = null;
        $location.path('/login');
    }

    $scope.remember = function($event) {
        // remember user password
        $event.preventDefault()
    }

    $scope.register = function($event) {
        $scope.provider = 'register';
        $event.preventDefault()
        // create new account
    }

}


function ServicesCtrl($scope,Service) {
    $scope.services = Service.query();
    $scope.listDisplay = 'list';
}

function ServiceDetailCtrl($scope,$routeParams,mbsimple,Service,$resource){
    $scope.service = Service.get({id:$routeParams.serviceId});
    $scope.mbsimple = mbsimple;
    $scope.show_advanced = mbsimple($scope.service.inputs);

}

function ProjectsCtrl($scope,Project) {
    $scope.projects = Project.query();
    $scope.listDisplay = 'list';
}

function ProjectDetailCtrl($scope,$routeParams,mbsimple,Project,$resource){
    $scope.project = Project.get({id:$routeParams.projectId});
    $scope.mbsimple = mbsimple;
}

function DataCtrl() {
}
