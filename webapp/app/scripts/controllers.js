'use strict';

/* Controllers */

angular.module('mobyle.controllers', []);

angular.module('mobyle.controllers').controller('LoginCtrl',
    function (LoginManager, $routeParams, $scope, $location, Login, Logout, PasswordResetRequest, PasswordReset, Project, CurrentProject) {
        $scope.logins = ['native', 'facebook', 'openid', 'twitter', 'github', 'persona', 'google'];
        //$scope.persona = Login.get('persona', {assertion:"XXX"});
        $scope.User = null;
        $scope.login = null;
        $scope.password = null;
        $scope.admin = false;
        $scope.currentProject = CurrentProject.get();
        $scope.$on('CurrentProject.update', function (event, currentProject) {
            $scope.currentProject = currentProject;
        });
        $scope.setCurrentProjectId = function (currentProjectId) {
            CurrentProject.setId(currentProjectId);
        }

        // Token for password resets
        $scope.token = $routeParams['token'];

        // Update the password of the user
        $scope.resetPassword = function () {
            if ($scope.rpassword == $scope.rpassword2) {
                var passwordResetRequest = new PasswordReset($scope.token, $scope.rpassword);
                var res = passwordResetRequest.get({}, function () {
                    $scope.msg = "Your password has been updated, you can login with your new password";
                });
                $scope.rpassword = null;
                $scope.provider = 'native';

            } else {
                $scope.msg = "Passwords are not identical";
            }
        }

        $scope.isAdmin = function () {
            return $scope.admin;
        }
        //if($routeParams['username']!=null && $routeParams['provider']!=null) {
        //    $scope.provider = $routeParams['provider'];
        //    LoginManager.result($routeParams['username'],'',0);
        //}

        $scope.alreadyLogged = function () {
            // Check at startup if user was previously logged on server
            var newuser = new Login('native');
            var res = newuser.get({
                username: $scope.login,
                password: $scope.password
            }, function () {
                LoginManager.result(res['user'], res['msg'], res['status'], res['admin'], res['default_project']);
            });
        }

        $scope.$on('LoginManager.update', function (event, login) {
            $scope.msg = login.msg;
            $scope.admin = login.admin;
            if (login.status == 0) {
                if ($scope.provider == 'register') {
                    $scope.provider = 'native';
                }

                $scope.password = null;
                $scope.rpassword = null;
                $scope.rpassword2 = null;

                $scope.setUser(login.user);
                CurrentProject.setId(login.defaultProjectId);
            } else {
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

        $scope.isProvider = function (type) {
            return type == $scope.provider;
        }

        $scope.setUser = function (user) {
            $scope.User = user;
            if ($location.path() == '/login') {
                $location.path('/');
            }
        }

        $scope.userLogged = function () {
            return $scope.User != null;
        }

        $scope.signIn = function (type) {
            $scope.msg = "";
            $scope.provider = type;
            if (type == 'persona') {
                navigator.id.request();
            } else if (type == 'register') {
                if ($scope.rpassword == $scope.rpassword2) {
                    var newuser = new Login('register');
                    var res = newuser.get({
                        username: $scope.rlogin,
                        password: $scope.rpassword
                    }, function () {
                        LoginManager.result(res['user'], res['msg'], res['status'], res['admin'], res['default_project']);
                    });
                } else {
                    $scope.msg = "Passwords are not identical";
                }
            } else if (type == 'native') {
                var newuser = new Login('native');
                var res = newuser.get({
                    username: $scope.login,
                    password: $scope.password
                }, function () {
                    LoginManager.result(res['user'], res['msg'], res['status'], res['admin'], res['default_project']);
                });
            } else if (type == 'google') {
                // Via velruse
            } else if (type == 'openid') {
                // Via velruse
            } else if (type == 'facebook') {
                // Via velruse
            } else if (type == 'reset') {
                // Temporary state to reset password
            } else {
                alert('not yet implemented');
            }
        }

        $scope.signOut = function () {
            if ($scope.provider == 'persona') {
                navigator.id.logout();
            } else {
                Logout().get();
            }
            $scope.setUser(null);
            $scope.provider = null;
            $location.path('/login');
        }

        $scope.remember = function ($event) {
            // remember user password
            var resetRequest = new PasswordResetRequest($scope.rlogin);
            var res = resetRequest.get({}, function () {
                $scope.msg = "A request has been sent, you will receive soon an email at the provided address to reset your password";
            });
            $event.preventDefault()
        }

        $scope.register = function ($event) {
            $scope.provider = 'register';
            $event.preventDefault()
            // create new account
        }

    });

angular.module('mobyle.controllers').controller('ServicesCtrl',
    function ($scope, Service) {
        $scope.services = Service.query();
        $scope.listDisplay = 'list';
    });

angular.module('mobyle.controllers').controller('ServiceDetailCtrl',
    function ($scope, $window, $routeParams, mbsimple, service) {
        var params = {
            public_name: $routeParams.name
        };
        $scope.service = service;
        /*
    Service.get(params).$promise.catch(
        function(error){
            $scope.alerts.push({type:'danger', msg:error})
            //flash([{ level: 'alert-block', text: 'service ' + $routeParams.name + ' not found!' }]);
        }
    );
*/
        $scope.mbsimple = mbsimple;
        $scope.show_advanced = mbsimple($scope.service.inputs);
    });

angular.module('mobyle.controllers').controller('DataTermsCtrl',
    function ($scope, DataTerm) {
        $scope.terms = DataTerm.query();
        $scope.listDisplay = 'list';
        $scope.object = "dataterm";
    });

angular.module('mobyle.controllers').controller('DataTermDetailCtrl',
    function ($scope, $routeParams, DataTerm, $resource) {
        $scope.term = DataTerm.get({
            id: $routeParams.dataTermId
        });
        $scope.object = "dataterm";
    });

angular.module('mobyle.controllers').controller('FormatTermsCtrl',
    function ($scope, FormatTerm) {
        $scope.terms = FormatTerm.query();
        $scope.listDisplay = 'list';
        $scope.object = "formatterm";
    });

angular.module('mobyle.controllers').controller('FormatTermDetailCtrl',
    function ($scope, $routeParams, FormatTerm, $resource) {
        $scope.term = FormatTerm.get({
            id: $routeParams.formatTermId
        });
        $scope.object = "formatterm";
    });

angular.module('mobyle.controllers').controller('ProjectsCtrl',
    function ($scope, $log, $modal, Project, $templateCache) {
        $scope.update = function () {
            $log.info("querying list of projects...");
            $scope.projects = Project.query();
        }
        $scope.projectGridOptions = {
            data: 'projects',
            enableRowSelection: false,
            columnDefs: [{
                    field: 'name',
                    displayName: 'Name',
                    width: "*",
                    cellTemplate: $templateCache.get('projectsGrid_NameCell.html')
            },
                {
                    field: 'getCreationDate() | date: "MMM d, y H:mm"',
                    displayName: 'Creation date',
                    width: "*"
            },
                {
                    field: 'description',
                    displayName: 'Description',
                    width: "***",
                    cellTemplate: $templateCache.get('projectsGrid_DescriptionCell.html')
            }
        ]
        }

        $scope.delete = function (p) {
            p.$delete().then(function () {
                $scope.projects.splice($scope.projects.indexOf(p), 1);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });;
        }

        $scope.edit_dialog = function (project) {
            var modalInstance = $modal.open({
                templateUrl: 'views/projectEditPropertiesModal.html',
                controller: 'ProjectEditPropertiesCtrl',
                resolve: {
                    project: function () {
                        return project;
                    }
                }
            });
            modalInstance.result.then(function (selectedItem) {
                if (project) {
                    project = selectedItem;
                } else {
                    $scope.projects.push(selectedItem);
                }
            });
        }

        $scope.update();
    });

angular.module('mobyle.controllers').controller('ProjectEditPropertiesCtrl',
    function ($scope, $log, $modalInstance, Project, CurrentUser, project) {
        // new project creation form
        $log.info("editing " + (project ? ('project ' + project.name) : ' new project'));
        if (!project) {
            $scope.project = new Project();
            $scope.project.name = "new project";

        } else {
            $log.info($scope.project);
            $scope.project = project;
        }
        $scope.ok = function () {
            if (!project) {
                $scope.project['owner'] = CurrentUser.get()._id.$oid;
                $scope.project['users'] = [{
                    'role': 'manager',
                    'user': $scope.project['owner']
            }];
            }
            $scope.project.$save().then(function () {
                $modalInstance.close($scope.project);
            }, function (test) {
                $log.error("ERROR=", $scope.project);
            });;
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

angular.module('mobyle.controllers').controller('ProjectDetailCtrl',
    function ($scope, $log, $modal, $routeParams, Project, ProjectData, $templateCache) {
        $scope.update = function () {
            $log.info("querying project " + $routeParams.projectId + "...");
            $scope.project = Project.get({
                id: $routeParams.projectId
            });
            $log.info("querying data for project " + $routeParams.projectId + "...");
            $scope.projectData = ProjectData.list_by_project({
                'project_id': $routeParams.projectId
            });
        }
        $scope.projectDataGridOptions = {
            data: 'projectData',
            enableRowSelection: false,
            columnDefs: [{
                    field: 'name',
                    displayName: 'Name',
                    width: "*"
            },
                {
                    field: 'description',
                    displayName: 'Description',
                    width: "**"
            },
                {
                    field: 'tags',
                    displayName: 'Tags',
                    cellTemplate: $templateCache.get('projectDataGrid_TagCell.html'),
                    width: "*"
            },
                {
                    field: 'data.size',
                    displayName: 'Size',
                    cellTemplate: $templateCache.get('projectDataGrid_DataSizeCell.html'),
                    width: "*"
            },
                {
                    field: 'data.type',
                    displayName: 'Type (format)',
                    width: "*****",
                    cellTemplate: $templateCache.get('projectDataGrid_DataTypeCell.html')
                }
                    ]
        }
        
        $scope.save = function () {
            $scope.project.$save();
        }

        $scope.deleteData = function (data) {
            data.$delete().then(function () {
                $scope.projectData.splice($scope.projectData.indexOf(data), 1);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });
        }

        $scope.addProjectData = function (data, project) {
            var modalInstance = $modal.open({
                templateUrl: 'views/dataEdit.html',
                controller: 'DataEditCtrl',
                resolve: {
                    data: function () {
                        return data;
                    },
                    project: function () {
                        return project;
                    }
                }
            });
            modalInstance.result.then(function (selectedItem) {
                if (data) {
                    data = selectedItem;
                } else {
                    $scope.projectData.push(selectedItem);
                }
            });
        }

        $scope.editProjectData = function (data, project) {
            var modalInstance = $modal.open({
                templateUrl: 'views/dataEdit.html',
                controller: 'DataEditCtrl',
                resolve: {
                    data: function () {
                        return data;
                    },
                    project: function () {
                        return project;
                    }
                }
            });
            modalInstance.result.then(function (selectedItem) {
                if (data) {
                    data = selectedItem;
                } else {
                    $scope.projectData.push(selectedItem);
                }
            });
        }

        $scope.update();
    });

angular.module('mobyle.controllers').controller('DataEditCtrl',
    function ($scope, $log, $modalInstance, ProjectData, CurrentUser, data, project, ServiceTypeTermRegistry) {
        // new project creation form
        $log.info("editing " + (data ? ('data ' + data.name) : (' new data for project ' + project)));
        $scope.project = project;
        $scope.alerts = [];
        ServiceTypeTermRegistry.dataTerms().then(function (struct) {
            $scope.data_format_terms = struct;
        });
        $scope.currentDataTerm = {};
        if (!data) {
            $scope.data = new ProjectData();
            $scope.data['project'] = project._id.$oid;
            $scope.data.name = "new data";
            $scope.data.tags = [];
            $scope.mode = 'paste';
            $scope.data.data = {
                'type': {}
            };
        } else {
            $scope.data = data;
        }
        $scope.ok = function () {
            $scope.data.data.type.data_terms = $scope.currentDataTerm.data_term_id;
            $scope.data.$save().then(function () {
                $modalInstance.close($scope.data);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

angular.module('mobyle.controllers').controller('mobyleCtrl',
    function ($rootScope) {
        $rootScope.alerts = [];
        $rootScope.closeAlert = function (index) {
            $rootScope.alerts.splice(index, 1);
        };
        $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
            $rootScope.alerts.push({
                type: 'danger',
                msg: rejection || 'unknown navigation error'
            });
        })
    });