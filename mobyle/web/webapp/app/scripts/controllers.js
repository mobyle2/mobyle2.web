'use strict';

/* Controllers */

angular.module('mobyle.controllers', []);

angular.module('mobyle.controllers').controller('WelcomeCtrl',
    function () {});

angular.module('mobyle.controllers').controller('NotificationCtrl',
    function ($scope, $interval, Notification, CurrentUser) {
        $scope.notifications = [];
        $scope.listDisplay = 'list';
        $scope.object = 'notification';

        $interval(function () {
            var user = CurrentUser.get();
            if (user && user.email !== undefined) {
                $scope.notifications = Notification.filter({
                    read: false
                });
            }
        }, 10000);

        $scope.read = function (notif) {
            notif.read = true;
            Notification.update(notif);
        };
    });

angular.module('mobyle.controllers').controller('NotificationCenterCtrl',
    function ($scope, $interval, $routeParams, Notification, NotificationList,
        Project, CurrentUser) {
        $scope.notifications = [];
        $scope.user = CurrentUser.get();
        if ($scope.user && $scope.user.email !== undefined) {
            $scope.notifications = Notification.query();
        }

        $scope.listDisplay = 'list';
        $scope.object = 'notification';
        $scope.show = 'unread';
        $scope.message = '';
        $scope.notification = {
            'sendall': false,
            'project': null,
            'message': '',
            'type': 1
        };

        $scope.projects = Project.query();

        $scope.display = function (type) {
            $scope.show = type;
        };
        $scope.update = function () {
            $scope.notifications = Notification.query();
        };

        $scope.send = function () {
            if (!$scope.notification.sendall) {
                $scope.notification.type = 1;
            } else {
                $scope.notification.type = 0;
            }
            NotificationList.notify($scope.notification);
            $scope.alerts.push({
                type: 'danger',
                msg: 'message sent'
            });
        };

        $scope.read = function (notif) {
            notif.read = true;
            Notification.update(notif);
            $scope.update();
        };

        $scope.mark_all_read = function () {
            var ids = [];
            var notif_count = $scope.notifications.length;
            for (var i = 0; i < notif_count; i++) {
                if (!$scope.notifications[i].read) {
                    ids.push($scope.notifications[i]._id.$oid);
                }
            }
            NotificationList.read_list(ids);
        };

        $scope.delete_all = function (type) {
            var ids = [];
            var search_type = true;
            if (type === 'unread') {
                search_type = false;
            }
            var notif_count = $scope.notifications.length;
            for (var i = 0; i < notif_count; i++) {
                if ($scope.notifications[i].read === search_type) {
                    ids.push($scope.notifications[i]._id.$oid);
                }
            }
            NotificationList.delete_list(ids);
        };

        $scope.delete = function (notif) {
            notif.$delete().then(function () {
                $scope.notifications.splice($scope.notifications.indexOf(notif), 1);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });
        };

        $interval(function () {
            $scope.user = CurrentUser.get();
            if ($scope.user && $scope.user.email !== undefined) {
                $scope.notifications = Notification.query();
            }
        }, 20000);

    });


angular.module('mobyle.controllers').controller('LoginCtrl',
    function (LoginManager, $routeParams, $scope, $location, Login, Logout, PasswordResetRequest, PasswordReset, Project, CurrentProject) {
        $scope.logins = ['native', 'facebook', 'openid', 'twitter', 'github', 'persona', 'google'];
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
        };

        // Token for password resets
        $scope.token = $routeParams.token;

        // Update the password of the user
        $scope.resetPassword = function () {
            if ($scope.rpassword === $scope.rpassword2) {
                var passwordResetRequest = new PasswordReset($scope.token, $scope.rpassword);
                passwordResetRequest.get({}, function () {
                    $scope.msg = 'Your password has been updated, you can login with your new password';
                });
                $scope.rpassword = null;
                $scope.provider = 'native';
            } else {
                $scope.msg = 'Passwords are not identical';
            }
        };

        $scope.isAdmin = function () {
            return $scope.admin;
        };

        $scope.alreadyLogged = function () {
            // Check at startup if user was previously logged on server
            var newuser = new Login('native');
            var res = newuser.get({
                username: $scope.login,
                password: $scope.password
            }, function () {
                LoginManager.result(res.user, res.msg, res.status, res.admin, res.default_project);
            });
        };

        $scope.$on('LoginManager.update', function (event, login) {
            $scope.msg = login.msg;
            $scope.admin = login.admin;
            if (login.status === 0) {
                if ($scope.provider === 'register') {
                    $scope.provider = 'native';
                }
                $scope.password = null;
                $scope.rpassword = null;
                $scope.rpassword2 = null;
                $scope.setUser(login.user);
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
            return type === $scope.provider;
        };

        $scope.setUser = function (user) {
            $scope.User = user;
            if ($location.path() === '/login') {
                $location.path('/');
            }
        };

        $scope.userLogged = function () {
            return $scope.User !== null;
        };

        $scope.signIn = function (type) {
            $scope.msg = '';
            $scope.provider = type;
            var newuser, res;
            if (type === 'persona') {
                navigator.id.request();
            } else if (type === 'register') {
                if ($scope.rpassword === $scope.rpassword2) {
                    newuser = new Login('register');
                    res = newuser.get({
                        username: $scope.rlogin,
                        password: $scope.rpassword
                    }, function () {
                        LoginManager.result(res.user, res.msg, res.status, res.admin, res.default_project);
                    });
                } else {
                    $scope.msg = 'Passwords are not identical';
                }
            } else if (type === 'native') {
                newuser = new Login('native');
                res = newuser.get({
                    username: $scope.login,
                    password: $scope.password
                }, function () {
                    LoginManager.result(res.user, res.msg, res.status, res.admin, res.default_project);
                });
            } else if (type === 'google') {
                // Via velruse
            } else if (type === 'openid') {
                // Via velruse
            } else if (type === 'facebook') {
                // Via velruse
            } else if (type === 'reset') {
                // Temporary state to reset password
            } else {
                console.error('not yet implemented');
            }
        };

        $scope.signOut = function () {
            if ($scope.provider === 'persona') {
                navigator.id.logout();
            } else {
                new Logout().get();
            }
            LoginManager.logout();
            $scope.setUser(null);
            $scope.provider = null;
            $location.path('/login');
        };

        $scope.remember = function ($event) {
            // remember user password
            var resetRequest = new PasswordResetRequest($scope.rlogin);
            resetRequest.get({}, function () {
                $scope.msg = 'A request has been sent, you will receive soon an email at the provided address to reset your password';
            });
            $event.preventDefault();
        };

        $scope.register = function ($event) {
            $scope.provider = 'register';
            $event.preventDefault();
            // create new account
        };

    });

angular.module('mobyle.controllers').controller('ServicesCtrl',
    function ($scope, Service) {
        $scope.services = Service.query();
        $scope.listDisplay = 'list';
    });

angular.module('mobyle.controllers').controller('ServiceDetailCtrl',
    function ($scope, $window, $routeParams, $location, mbsimple, service, sourceJob, Job, CurrentProject) {
        $scope.reset = function () {
            if (sourceJob) {
                $scope.service = sourceJob.service;
                $scope.job = sourceJob;
                $scope.job.project = CurrentProject.get();
            } else {
                $scope.service = service;
                $scope.job = new Job();
                $scope.job.project = CurrentProject.get();
                $scope.job.service = $scope.service;
                $scope.job.inputs = {};
                $scope.job.outputs = {};
            }
            $scope.showAdvanced = mbsimple($scope.service.inputs);
        };
        $scope.mbsimple = mbsimple;
        $scope.submit = function () {
            $scope.job.$save().then(function () {
                $location.path('/jobs/' + $scope.job._id.$oid);
            });
            // after job submission, what should we do? reset the entire job? just the generated _id?
            // navigate to job display?
        };
        $scope.reset();
    });

angular.module('mobyle.controllers').controller('DataTermsCtrl',
    function ($scope, DataTerm) {
        $scope.terms = DataTerm.query();
        $scope.listDisplay = 'list';
        $scope.object = 'dataterm';
    });

angular.module('mobyle.controllers').controller('DataTermDetailCtrl',
    function ($scope, $routeParams, DataTerm) {
        $scope.term = DataTerm.get({
            id: $routeParams.dataTermId
        });
        $scope.object = 'dataterm';
    });

angular.module('mobyle.controllers').controller('FormatTermsCtrl',
    function ($scope, FormatTerm) {
        $scope.terms = FormatTerm.query();
        $scope.listDisplay = 'list';
        $scope.object = 'formatterm';
    });

angular.module('mobyle.controllers').controller('FormatTermDetailCtrl',
    function ($scope, $routeParams, FormatTerm) {
        $scope.term = FormatTerm.get({
            id: $routeParams.formatTermId
        });
        $scope.object = 'formatterm';
    });

angular.module('mobyle.controllers').controller('ProjectsCtrl',
    function ($scope, $log, $modal, Project, $templateCache) {
        $scope.update = function () {
            $log.info('querying list of projects...');
            $scope.projects = Project.query();
        };
        $scope.projectGridOptions = {
            data: 'projects',
            enableRowSelection: false,
            columnDefs: [{
                    field: 'name',
                    displayName: 'Name',
                    width: '*',
                    cellTemplate: $templateCache.get('projectsGrid_NameCell.html')
            },
                {
                    field: 'getCreationDate() | date: "MMM d, y H:mm"',
                    displayName: 'Creation date',
                    width: '*'
            },
                {
                    field: 'description',
                    displayName: 'Description',
                    width: '***',
                    cellTemplate: $templateCache.get('projectsGrid_DescriptionCell.html')
            }
        ]};

        $scope.delete = function (p) {
            p.$delete().then(function () {
                $scope.projects.splice($scope.projects.indexOf(p), 1);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });
        };

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
        };

        $scope.update();
    });

angular.module('mobyle.controllers').controller('JobsCtrl',
    function ($scope, $log, $modal, $routeParams, Job, CurrentProject, $templateCache) {
        $scope.project = CurrentProject.get();
        $scope.update = function () {
            $scope.project.$promise.then(function () {
                $scope.projectJobs = Job.list_by_project({
                    'project_id': CurrentProject.get()._id.$oid
                });
            });
        };
        $scope.projectDataGridOptions = {
            data: 'projectJobs',
            enableRowSelection: false,
            rowTemplate: $templateCache.get('jobsGrid_Row.html'),
            columnDefs: [{
                    field: '_id.$oid',
                    displayName: 'name',
                    width: '**',
                    cellTemplate: $templateCache.get('jobsGrid_NameCell.html')
            },
                {
                    field: '_id.$oid',
                    displayName: 'ID',
                    width: '**'
            },
                {
                    field: 'getCreationDate() | date: "MMM d, y H:mm"',
                    displayName: 'Creation date',
                    width: '*'
            },
                {
                    field: 'status',
                    displayName: 'Status',
                    width: '*',
                    cellTemplate: $templateCache.get('jobsGrid_StatusCell.html')
            }]
        };
        $scope.deleteJob = function (job) {
            job.$delete().then(function () {
                $scope.projectJobs.splice($scope.projectJobs.indexOf(job), 1);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });
        };
        $scope.update();
        $scope.$on('CurrentProject.update', function (event, currentProject) {
            $scope.project = currentProject;
            $scope.update();
        });
    });

angular.module('mobyle.controllers').controller('JobDetailCtrl',
    function ($scope, job, mbset) {
        $scope.job = job;
        $scope.mbset = mbset;
        $scope.showAdvanced = true;
    });



angular.module('mobyle.controllers').controller('ProjectEditPropertiesCtrl',
    function ($scope, $log, $modalInstance, Project, CurrentUser, project) {
        // new project creation form
        $log.info('editing ' + (project ? ('project ' + project.name) : ' new project'));
        if (!project) {
            $scope.project = new Project();
            $scope.project.name = 'new project';

        } else {
            $log.info($scope.project);
            $scope.project = project;
        }
        $scope.ok = function () {
            if (!project) {
                $scope.project.owner = CurrentUser.get()._id.$oid;
                $scope.project.users = [{
                    'role': 'manager',
                    'user': $scope.project.owner
            }];
            }
            $scope.project.$save().then(function () {
                $modalInstance.close($scope.project);
            });
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });

angular.module('mobyle.controllers').controller('DatasCtrl',
    function ($scope, $log, $modal, $routeParams, $window, CurrentProject, ProjectData, $templateCache) {
        $scope.project = CurrentProject.get();
        $scope.update = function () {
            $scope.project.$promise.then(function () {
                $scope.projectData = ProjectData.list_by_project({
                    'project_id': $scope.project._id.$oid
                });
            });
        };
        $scope.projectDataGridOptions = {
            data: 'projectData',
            enableRowSelection: false,
            columnDefs: [{
                    field: 'name',
                    displayName: 'Name',
                    width: '*'
            },
                {
                    field: 'description',
                    displayName: 'Description',
                    width: '**'
            },
                {
                    field: 'tags',
                    displayName: 'Tags',
                    cellTemplate: $templateCache.get('projectDataGrid_TagCell.html'),
                    width: '*'
            },
                {
                    field: 'data.size',
                    displayName: 'Size',
                    cellTemplate: $templateCache.get('projectDataGrid_DataSizeCell.html'),
                    width: '*'
            },
                {
                    field: 'data.type',
                    displayName: 'Type (format)',
                    width: '**',
                    cellTemplate: $templateCache.get('projectDataGrid_DataTypeCell.html')
                },
                {
                    field: 'test',
                    displayName: 'Actions',
                    width: '**',
                    cellTemplate: $templateCache.get('projectDataGrid_ActionsCell.html')
                }
                    ]
        };

        $scope.viewData = function (data) {
            $window.open('/api/projectdata/' + data._id.$oid + '/raw');
        };

        $scope.downloadData = function (data) {
            $window.open('/api/projectdata/' + data._id.$oid + '/dl');
        };

        $scope.deleteData = function (data) {
            data.$delete().then(function () {
                $scope.projectData.splice($scope.projectData.indexOf(data), 1);
            }, function (errorResponse) {
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorResponse.data.detail
                });
            });
        };

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
        };

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
        };

        $scope.update();
        $scope.$on('CurrentProject.update', function (event, currentProject) {
            $scope.project = currentProject;
            $scope.update();
        });
    });

angular.module('mobyle.controllers').controller('DataEditCtrl',
    function ($scope, $log, $modalInstance, ProjectData, CurrentUser, data, project, ServiceTypeTermRegistry) {
        // new project creation form
        $log.info('editing ' + (data ? ('data ' + data.name) : (' new data for project ' + project)));
        $scope.project = project;
        $scope.alerts = [];
        ServiceTypeTermRegistry.dataTerms().then(function (struct) {
            $scope.data_format_terms = struct;
        });
        $scope.currentDataTerm = {};
        if (!data) {
            $scope.data = new ProjectData();
            $scope.data.project = project._id.$oid;
            $scope.data.name = 'new data';
            $scope.data.tags = [];
            $scope.mode = 'paste';
            $scope.data.data = {
                'type': {}
            };
        } else {
            $scope.data = data;
        }
        $scope.resetFormat = function () {
            $scope.data.data.type.format_terms = null;
        };
        $scope.ok = function () {
            $scope.data.data.type.data_terms = $scope.currentDataTerm.term_id;
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

angular.module('mobyle.controllers').controller('DataSelectCtrl',
    function ($scope, $log, $modalInstance, ProjectData, para, CurrentProject) {
        $scope.para = para;
        $scope.project = CurrentProject.get();
        $scope.pagedProjectData = [];
        $scope.totalServerItems = 0;
        $scope.setPagingData = function(data, pageSize, page){
            if (data===undefined){
                return;
            }
            $scope.pagedProjectData = data.slice((page - 1) * pageSize, page * pageSize);
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };
        $scope.pagingOptions = {
            pageSizes: [5, 10, 20],
            pageSize: 5,
            currentPage: 1
        };  
        $scope.project.$promise.then(function () {
            ProjectData.listByProject($scope.project, para.type).then(function(dataList){
                $scope.projectData = dataList;
                $scope.setPagingData($scope.projectData, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
                $scope.totalServerItems = $scope.projectData.length;
            });
        });
        $scope.$watch('pagingOptions', function () {
              $scope.setPagingData($scope.projectData, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }, true);
        $scope.selectedRows = [];
        $scope.projectDataGridOptions = {
            data: 'pagedProjectData',
            showFooter: true,
            totalServerItems:'totalServerItems',
            enablePaging: true,
            pagingOptions: $scope.pagingOptions,
            enableRowSelection: true,
            multiSelect: false,
            // FIXME paging does not work
            columnDefs: [
                        {
                                field: 'name',
                                displayName: 'Name',
                                width: '*'
                        },
                        {
                                field: 'description',
                                displayName: 'Description',
                                width: '**'
                        }
            ],
            selectedItems:$scope.selectedRows,
            afterSelectionChange: function(){
                // clicking on a row selects it
                $scope.ok();
            }
        };
        $scope.ok = function () {
            $modalInstance.close($scope.selectedRows);
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
        $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
            $rootScope.alerts.push({
                type: 'danger',
                msg: rejection || 'unknown navigation error'
            });
        });
    });