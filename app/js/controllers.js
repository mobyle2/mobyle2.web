'use strict';

/* Controllers */

function UserCtrl($scope) {
    $scope.admin = false;

}

function LoginCtrl(LoginManager, $routeParams, $scope, $location, Login, Logout) {
    $scope.logins = ['native', 'facebook', 'openid', 'twitter', 'github', 'persona', 'google' ];
    //$scope.persona = Login.get('persona', {assertion:"XXX"});
    $scope.User = null;
    $scope.login = null;
    $scope.password = null;

    if($routeParams['username']!=null && $routeParams['provider']!=null) {
        $scope.provider = $routeParams['provider'];
        LoginManager.result($routeParams['username'],'',0);
    }

    $scope.alreadyLogged = function() {
        console.log("check if logged");
        var newuser = new Login('native');
        var res = newuser.get({username: $scope.login, password: $scope.password}, function() {
            LoginManager.result(res['user'],res['msg'],res['status']);
            console.log(res);
        });
    }

    $scope.$on( 'LoginManager.update', function( event, login ) {
        $scope.msg = login.msg;
        if (login.status==0) {
            if($scope.provider=='register') {
                $scope.provider = 'native';
            }

            $scope.password = null;
            $scope.rpassword = null;
            $scope.rpassword2 = null;

            $scope.setUser(login.user);
        }
        else {
            $scope.User = null;
        }

    });

    // For register
    $scope.rlogin = null;
    $scope.rpassword = null;
    $scope.rpassword2 = null;

    // For serve side verification
    $scope.token = null;

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
        $scope.msg = "";
        $scope.provider = type;
        if(type == 'persona') {
            navigator.id.request();
        }
        else if (type == 'register') {
            if($scope.rpassword == $scope.rpassword2) {
                var newuser = new Login('register');
                var res = newuser.get({username: $scope.rlogin, password: $scope.rpassword});

            }
            else {
                $scope.msg = "Passwords are not identical";
            }
        }
        else if(type == 'native'){
            var newuser = new Login('native');
            var res = newuser.get({username: $scope.login, password: $scope.password}, function() {
                    LoginManager.result(res['user'],res['msg'],res['status']);
            });

        }
        else if(type == 'google') {
            // send login info to pyramid and check token on server side. Get user info in return

        }
        else if(type == 'openid'){

        }
        else if(type == 'facebook'){

        }
        else {
            alert('not yet implemented');
        }
    }

    $scope.signOut = function() {
        if($scope.provider == 'persona') {
            navigator.id.logout();
        }
        else {
            Logout().get();
        }
        $scope.setUser(null);
        $scope.provider = null;
        $location.path('/login');
    }

    $scope.remember = function($event) {
        // remember user password
        alert('not yet implemented');
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
