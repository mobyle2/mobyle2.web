'use strict';

/* Controllers */


function LoginCtrl(LoginManager, $routeParams, $scope, $location, Login, Logout, PasswordResetRequest, PasswordReset, Project, CurrentProject) {
    $scope.logins = ['native', 'facebook', 'openid', 'twitter', 'github', 'persona', 'google' ];
    //$scope.persona = Login.get('persona', {assertion:"XXX"});
    $scope.User = null;
    $scope.login = null;
    $scope.password = null;
    $scope.admin = false;
    $scope.currentProject = CurrentProject.get();
    $scope.$on( 'CurrentProject.update', function( event, currentProject ) {
        $scope.currentProject = currentProject;
    });
    $scope.setCurrentProjectId = function(currentProjectId){
        CurrentProject.setId(currentProjectId);
    }

    // Token for password resets
    $scope.token = $routeParams['token'];

    // Update the password of the user
    $scope.resetPassword = function() {
        if($scope.rpassword == $scope.rpassword2) {
            var passwordResetRequest = new PasswordReset($scope.token, $scope.rpassword);
            var res = passwordResetRequest.get({}, function() {
                $scope.msg ="Your password has been updated, you can login with your new password";
            });
            $scope.rpassword = null;
            $scope.provider = 'native';

        }
        else {
            $scope.msg = "Passwords are not identical";
        }
    }

    $scope.isAdmin = function() {
        return $scope.admin;
    }
    //if($routeParams['username']!=null && $routeParams['provider']!=null) {
    //    $scope.provider = $routeParams['provider'];
    //    LoginManager.result($routeParams['username'],'',0);
    //}

    $scope.alreadyLogged = function() {
        // Check at startup if user was previously logged on server
        var newuser = new Login('native');
        var res = newuser.get({username: $scope.login, password: $scope.password}, function() {
            LoginManager.result(res['user'],res['msg'],res['status'],res['admin'], res['default_project']);
        });
    }

    $scope.$on( 'LoginManager.update', function( event, login ) {
        $scope.msg = login.msg;
        $scope.admin = login.admin;
        if (login.status==0) {
            if($scope.provider=='register') {
                $scope.provider = 'native';
            }

            $scope.password = null;
            $scope.rpassword = null;
            $scope.rpassword2 = null;

            $scope.setUser(login.user);
            CurrentProject.setId(login.defaultProjectId);
        }
        else {
            $scope.User = null;
            CurrentProject.setId(null);
        }
        $scope.admin = login.admin;
    });

    // For register
    $scope.rlogin = null;
    $scope.rpassword = null;
    $scope.rpassword2 = null;



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
                var res = newuser.get({username: $scope.rlogin, password: 
$scope.rpassword}, function() {
                LoginManager.result(res['user'],res['msg'],res['status'], res['admin'], res['default_project']);  });
            }
            else {
                $scope.msg = "Passwords are not identical";
            }
        }
        else if(type == 'native'){
            var newuser = new Login('native');
            var res = newuser.get({username: $scope.login, password: $scope.password}, function() {
                    LoginManager.result(res['user'],res['msg'],res['status'], res['admin'], res['default_project']);
            });
        }
        else if(type == 'google') {
              // Via velruse
        }
        else if(type == 'openid'){
            // Via velruse
        }
        else if(type == 'facebook'){
            // Via velruse
        }
        else if(type == 'reset'){
            // Temporary state to reset password
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
        var resetRequest = new PasswordResetRequest($scope.rlogin);
        var res = resetRequest.get({}, function() {
            $scope.msg = "A request has been sent, you will receive soon an email at the provided address to reset your password";
        });
        $event.preventDefault()
    }

    $scope.register = function($event) {
        $scope.provider = 'register';
        $event.preventDefault()
        // create new account
    }

}

function ClassificationCtrl($scope,$routeParams,Classification) {
    $scope.load = function(query){
        $scope.loading = true;
        $scope.tree = null;
        $scope.defaultToggleState = !query;
        Classification.query({key:$routeParams.key,filter:query},function(classification){
            $scope.tree = classification;
            $scope.loading = false;
        });
    }
    $scope.load();
    $scope.$watch('query',function(newValue,oldValue){
        if((!oldValue || oldValue.length<3) && (!newValue || newValue.length<3)){
            return;
        }else if(!newValue || newValue.length<3){
            $scope.load(null);
        }else{
            $scope.load(newValue);
        }
    });
}

function ServicesCtrl($scope,Service) {
    $scope.services = Service.query();
    $scope.listDisplay = 'list';
}

function ServiceDetailCtrl($scope,$window,$routeParams,mbsimple,Service,$resource,flash){
    var params = {public_name:$routeParams.name};
    $scope.service = Service.get(params).$promise.catch(
        function(error){
            flash([{ level: 'alert-block', text: 'service ' + $routeParams.name + ' not found!' }]);
        }
    );
    $scope.mbsimple = mbsimple;
    $scope.show_advanced = mbsimple($scope.service.inputs);
}

function DataTermsCtrl($scope,DataTerm) {
    $scope.terms= DataTerm.query();
    $scope.listDisplay = 'list';
    $scope.object = "dataterm";
}

function DataTermDetailCtrl($scope,$routeParams,DataTerm,$resource){
    $scope.term = DataTerm.get({id:$routeParams.dataTermId});
    $scope.object = "dataterm";
}

function FormatTermsCtrl($scope,FormatTerm) {
    $scope.terms= FormatTerm.query();
    $scope.listDisplay = 'list';
    $scope.object = "formatterm";
}

function FormatTermDetailCtrl($scope,$routeParams,FormatTerm,$resource){
    $scope.term = FormatTerm.get({id:$routeParams.formatTermId});
    $scope.object = "formatterm";
}

function ProjectsCtrl($scope, $log, $modal, Project) {
    $scope.update = function(){
        $log.info("querying list of projects...");
        $scope.projects = Project.query();
    }
    var usersTemplate = '<div ng-repeat="access in row.getProperty(col.field)">{{access.user.$oid}} - {{access.role}}</div>';
    $scope.projectGridOptions = {data:'projects',
                                 enableRowSelection:false,
        columnDefs: [{ field: 'name',
            displayName: 'Name',
            width: "**",
            cellTemplate: '<a href="#/projects/{{row.getProperty(\'_id\').$oid}}">{{row.getProperty(col.field)}}</a><i ng-show="row.getProperty(\'public\')" class="icon-globe"></i>'},
            { field: 'notebook',
              displayName: 'Notebook',
              width: "***"},
            { field: 'users',
              cellTemplate: usersTemplate,
              displayName: 'Access',
              width: "***"
            },
            { field: '',
              cellTemplate: '<span><button tooltip="Edit project properties" ng-click="edit_dialog(row.entity)"><i class="icon-pencil"></i></button>'+
                            '<button tooltip="Remove project" ng-click="delete(row.entity)" ><i class="icon-trash"></i></button></span>',
              width: '*'
            }
        ]}

    $scope.delete = function(p){
        p.$delete($scope.update);
    }

    $scope.edit_dialog = function(project){
        var modalInstance = $modal.open({
            templateUrl: 'partials/projectEditProperties.html',
            controller: ProjectEditPropertiesCtrl,
            resolve: {
                project: function(){ return project;}
            }
        });
        modalInstance.result.then(function (selectedItem) {
            $scope.update();
        });
    }

    $scope.update();
}

function ProjectEditPropertiesCtrl($scope, $log, $modalInstance, Project, CurrentUser, project){
    // new project creation form
    $log.info("editing " + (project ? ('project ' + project.name) : ' new project'));
    if(!project){
        $scope.project = new Project();
        $scope.project.name = "new project";

    }else{
        $log.info($scope.project);
        $scope.project = project;
    }
    $scope.ok = function () {
        if(!project){
            $scope.project['owner'] = CurrentUser.get()._id.$oid;
            $scope.project['users'] = [{'role':'manager', 'user':$scope.project['owner']}];
        }
        $scope.project.$save($modalInstance.close($scope.project));
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}

function ProjectDetailCtrl($scope,$routeParams,mbsimple,Project,ProjectData){
    $scope.project = Project.get({id:$routeParams.projectId});
    $scope.mbsimple = mbsimple;
    $scope.projectData = ProjectData.query();
    var tagCellTemplate = '<div class="ngCellText colt{{$index}}">'+
                             '<span class="label" ng-repeat="l in row.getProperty(col.field)">{{l}}</span>'+
                          '</div>';
    $scope.projectDataGridOptions = {data:'projectData',
                                     columnDefs: [{ field: 'name',
                                                    displayName: 'Name',
                                                    width: "*"},
                                                  { field: 'description',
                                                    displayName: 'Description',
                                                    width: "*"},
                                                 { field: 'tags',
                                                     displayName: 'Tags',
                                                     cellTemplate: tagCellTemplate,
                                                     width: "*"},
                                                 { field: 'data',
                                                     displayName: 'Data',
                                                     width: "*"
                                                     }
                                                 ]}

    $scope.createData = function(){
        ProjectData.save(newProjectData);
    }
    
}

function DataCtrl() {
}
