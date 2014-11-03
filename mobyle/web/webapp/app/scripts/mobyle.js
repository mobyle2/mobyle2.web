/*global $:false, _:false, angular:false */
/*jslint browser: true, indent: 4, vars: true, nomen: true, es5: true */
'use strict';

// Declare app level module which depends on filters, and services
angular.module('mobyle', ['mobyle.resources', 'ngSanitize', 'ngCookies', 'ngRoute', 'ui.utils', 'ui.tinymce', 'ui.bootstrap', 'ngGrid']).
config(['$routeProvider','$logProvider',
    function ($routeProvider, $log) {
        $routeProvider.when('/welcome', {
            templateUrl: 'views/welcome.html',
            controller: 'WelcomeCtrl'
        });
        $routeProvider.when('/services', {
            templateUrl: 'views/services.html',
            controller: 'ServicesCtrl'
        });
        var serviceDetailRoute = {
            templateUrl: 'views/serviceDetail.html',
            controller: 'ServiceDetailCtrl',
            resolve: {
                service: function ($route, Service, $q) {
                    var deferred = $q.defer();
                    Service.get({
                        public_name: $route.current.params.name
                    }, function (successData) {
                        deferred.resolve(successData);
                    }, function (errorData) {
                        $log.error('service ' + $route.current.params.name + ' not found!', errorData);
                        deferred.reject('service ' + $route.current.params.name + ' not found!');
                    });
                    return deferred.promise;
                },
                sourceJob: function(){
                    return null;
                }
            }
        };
        $routeProvider.when('/services/:name/:version?', serviceDetailRoute);
        $routeProvider.when('/projects/:project/services/:name/:version?', serviceDetailRoute);
        $routeProvider.when('/projects', {
            templateUrl: 'views/projects.html',
            controller: 'ProjectsCtrl'
        });
        $routeProvider.when('/datas', {
            templateUrl: 'views/datas.html',
            controller: 'DatasCtrl'
        });
        $routeProvider.when('/jobs', {
            templateUrl: 'views/jobs.html',
            controller: 'JobsCtrl'
        });
        var jobDetailRoute = {
            templateUrl: 'views/jobDetail.html',
            controller: 'JobDetailCtrl',
            resolve: {
                job: function ($route, Job, $q) {
                    var deferred = $q.defer();
                    Job.get({id: $route.current.params.jobId
                    }, function (successData) {
                        deferred.resolve(successData);
                    }, function (errorData) {
                        $log.error('job ' + $route.current.params.jobId + ' not found!', errorData);
                        deferred.reject('job ' + $route.current.params.jobId + ' not found!');
                    });
                    return deferred.promise;
                }
            }
        };
        $routeProvider.when('/jobs/:jobId', jobDetailRoute);
        var jobReplayRoute = {
            templateUrl: 'views/serviceDetail.html',
            controller: 'ServiceDetailCtrl',
            resolve: {
                sourceJob: function ($route, Job, $q) {
                    var deferred = $q.defer();
                    Job.get({id: $route.current.params.jobId
                    }, function (successData) {
                        deferred.resolve(successData.getReplayJob());
                    }, function (errorData) {
                        $log.error('job ' + $route.current.params.jobId + ' not found!', errorData);
                        deferred.reject('job ' + $route.current.params.jobId + ' not found!');
                    });
                    return deferred.promise;
                },
                service: function(){
                    return null;
                }
            }
        };
        $routeProvider.when('/jobs/:jobId/replay', jobReplayRoute);
        $routeProvider.when('/dataterms', {
            templateUrl: 'views/terms.html',
            controller: 'DataTermsCtrl'
        });
        $routeProvider.when('/dataterms/:dataTermId', {
            templateUrl: 'views/termDetail.html',
            controller: 'DataTermDetailCtrl'
        });
        $routeProvider.when('/formatterms', {
            templateUrl: 'views/terms.html',
            controller: 'FormatTermsCtrl'
        });
        $routeProvider.when('/formatterms/:formatTermId', {
            templateUrl: 'views/termDetail.html',
            controller: 'FormatTermDetailCtrl'
        });
        $routeProvider.when('/login', {
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/logout', {
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/my', {
            templateUrl: 'views/my.html',
            controller: 'MyCtrl'
        });
        $routeProvider.when('/my/password_reset', {
            templateUrl: 'views/my_password_reset.html',
            controller: 'LoginCtrl'
        });
        $routeProvider.when('/notificationcenter', {
            templateUrl: 'views/notificationcenter.html',
            controller: 'NotificationCenterCtrl'
        });
        $routeProvider.when('/admin', {
            templateUrl: 'views/admin/admin.html',
            controller: 'AdminCtrl'
        });
        $routeProvider.when('/admin/config', {
            templateUrl: 'views/admin/config.html',
            controller: 'AdminConfigCtrl'
        });
        $routeProvider.when('/admin/user', {
            templateUrl: 'views/admin/user.html',
            controller: 'AdminUserCtrl'
        });
        $routeProvider.when('/admin/job', {
            templateUrl: 'views/admin/job.html',
            controller: 'AdminJobCtrl'
        });
        $routeProvider.when('/admin/service', {
            templateUrl: 'views/admin/service.html',
            controller: 'AdminServiceCtrl'
        });
        $routeProvider.otherwise({
            redirectTo: '/welcome'
        });
  }]);

/* Services */

angular.module('mobyle').value('mbsimple', function (para) {
    // detect if a parameter or a paragraph is "simple"
    // it is simple if it has the "simple" property set to true
    // or if one of its children has the "simple" property set to true
    function simple(para) {
        if (!para) {
            return false;
        }
        if (!para.children) {
            return para.simple === true;
        } else {
            return para.children.filter(simple).length > 0;
        }
    }
    return simple(para);
});

angular.module('mobyle').value('mbset', function (para, valuesMap) {
    // detect if a parameter or a paragraph is "set"
    // it is set if it has its value set to true
    // or if one of its children has its value set to true
    if(!valuesMap){
        return false;
    }
    function set(para) {
        if (!para) {
            return false;
        }
        if (!para.children) {
            if(valuesMap[para.name] && (valuesMap[para.name].data || valuesMap[para.name].value)){
                return true;
            }else{
                return false;
            }
        } else {
            return para.children.filter(set).length > 0;
        }
    }
    return set(para);
});

angular.module('mobyle').factory('CurrentProject', function (Project, LoginManager, $rootScope, $cookies) {
    var currentProject = {};

    function setId(currentProjectId) {
        currentProject = Project.get({
            id: currentProjectId
        });
        $cookies.currentProjectId = currentProjectId;
        $rootScope.$broadcast('CurrentProject.update', currentProject);
    }

    function reset() {
        currentProject = null;
        delete $cookies.currentProjectId;
        delete $cookies.currentUserId;
    }

    $rootScope.$on('LoginManager.logout', function () {
        reset();
    });

    $rootScope.$on('CurrentUser.update', function (event, user) {
        // once a new user is loaded update the current project
        if(!currentProject || $cookies.currentUserId!==user._id.$oid){
            $cookies.currentUserId = user._id.$oid;
            setId(user.default_project.$oid);
        }
    });

    function get() {
        return currentProject;
    }

    setId($cookies.currentProjectId);

    return {
        setId: setId,
        get: get
    };
});

angular.module('mobyle').factory('CurrentUser', function (User, LoginManager, $rootScope, $log) {
    var user = null;
    var load = function (email) {
        $log.info('load current user info for ' + email);
        User.query({
                'email': email
            }).$promise.then(function (users) {
                if(!user || users[0]._id.$oid!==user._id.$oid){
                    user = users[0];
                    $rootScope.$broadcast('CurrentUser.update', user);
                    if(user!==undefined){
                        $log.info('current user loaded: ' + user.email);
                    }else{
                        $log.info('no current user loaded');
                    }
                }
            });
    };

    function reset() {
        user = null;
    }

    $rootScope.$on('LoginManager.logout', function () {
        reset();
    });

    $rootScope.$on('LoginManager.update', function (event, login) {
        load(login.user);
    });

    if(LoginManager.login.user){
        load(LoginManager.login.user);
    }

    var get = function () {
        return user;
    };

    return {
        'get': get
    };
});

/**
 *   Login controller is used at multiple places (global + login page).
 *   USe this service to store login process elements and notify controllers on update
 */
angular.module('mobyle').factory('LoginManager', function ($rootScope) {

    return {
        login: {
            'user': null,
            'msg': '',
            'status': 0,
            'admin': false,
            'default_project': null
        },
        result: function (user, msg, status, admin, default_project) {
            this.login.user = user;
            this.login.msg = msg;
            this.login.status = status;
            this.login.admin = admin;
            this.login.defaultProjectId = default_project;
            $rootScope.$broadcast('LoginManager.update', this.login);
        },
        logout: function(){
            $rootScope.$broadcast('LoginManager.logout');
        }
    };
});

angular.module('mobyle').value('evalBoolFactory', function (values) {
    // computes a boolean expression comprised of a combination of
    // comparison and logical operators over a set of values
    var evalBoolFactory = function (expr) {
        if (!expr) {
            return true;
        }
        var res = true;
        if(typeof expr === 'string'){
            // expression is a variable name, test if it is truthy
            res = Boolean(values[expr]);
        }else{
            $.each(expr, function (key, value) {
                if (values.hasOwnProperty(key)) {
                    switch (typeof value) {
                    case 'number':
                    case 'string':
                    case 'boolean':
                    case 'undefined':
                        if (values[key] !== value) {
                            res = false;
                        } else {
                            res = true;
                        }
                        break;
                    case 'object':
                        // handle comparison operators
                        $.each(value, function(operator, operand){
                            switch (operator) {
                                case '#gt':
                                    res = (Number(values[key]) > Number(operand));
                                    break;
                                case '#gte':
                                    res = (Number(values[key]) >= Number(operand));
                                    break;
                                case '#lt':
                                    res = (Number(values[key]) < Number(operand));
                                    break;
                                case '#lte':
                                    res = (Number(values[key]) <= Number(operand));
                                    break;
                                case '#in':
                                    res = $.inArray(values[key], operand)!==-1;
                                    break;
                                case '#nin':
                                    res = $.inArray(values[key], operand)===-1;
                                    break;
                                case '#ne':
                                    res = (values[key] !== operand);
                                    break;
                            }
                            if (!res){
                                return false;
                            }
                        });
                        break;
                    }
                } else {
                    // handle logical operators
                    switch (key) {
                    case '#or':
                        res = false;
                        $.each(value, function (index, innerValue) {
                            if (evalBoolFactory(innerValue)) {
                                res = true;
                                return false;
                            }
                        });
                        break;
                    case '#and':
                        res = true;
                        $.each(value, function (index, innerValue) {
                            if (!evalBoolFactory(innerValue)) {
                                res = false;
                                return false;
                            }
                        });
                        break;
                    case '#not':
                        res = !evalBoolFactory(value);
                        break;
                    case '#nor':
                        res = true;
                        $.each(value, function (index, innerValue) {
                            if (evalBoolFactory(innerValue)) {
                                res = false;
                                return false;
                            }
                        });
                        break;
                    }
                }
                return res;
            });
        }
        return res;
    };
    return evalBoolFactory;
});

function preg_quote(str) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // *     example 1: preg_quote('$40');
    // *     returns 1: '\$40'
    // *     example 2: preg_quote('*RRRING* Hello?');
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote('\\.+*?[^]$(){}=!<>|:');
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

    return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<\>\|\:])/g, '\\$1');
}

function highlight(data, search) {
    return data.replace(new RegExp('(' + preg_quote(search) + ')', 'gi'), '<b>$1</b>');
}

/* Filters */
angular.module('mobyle').
filter('kwSearch', function () {
    // kwSearch searches for a query string (q)
    // in each service description of an array (s)
    // in the properties
    return function (s, q, f, case_insensitive) {
        // cancel search if query string is shorter than 3 chars. long
        if (!q || q.length < 3) {
            return s;
        }
        var out = []; // array of matching services
        for (var i = 0; i < s.length; i++) {
            var o = angular.copy(s[i]);
            for (var j = 0; j < f.length; j++) {
                if (o[f[j]] && ((!case_insensitive && o[f[j]].indexOf(q) !== -1) || (case_insensitive && o[f[j]].toUpperCase().indexOf(q.toUpperCase()) !== -1))) {
                    // if matching. set found flag and highlight match(es)
                    if (!case_insensitive) {
                        o[f[j] + 'Hl'] = o[f[j]].replace(q, '<strong>' + q + '</strong>', 'g');
                    } else {
                        o[f[j] + 'Hl'] = highlight(o[f[j]], q);
                    }
                    o.found = true;
                }
            }
            if (o.found) {
                out.push(o);
            }
        }
        return out;
    };
});

angular.module('mobyle').filter('humanSize', function () {
    // humanSize displays a size in bytes by converting
    // into the most appropriate human-understandable unit
    return function (bytes) {
        if (bytes <= 0) {
            return 0;
        }
        var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        var e = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + ' ' + s[e];
    };
});

  angular.module('mobyle').directive('showtab',
  function () {
      return {
          link: function (scope, element, attrs) {
              element.click(function(e) {
                  e.preventDefault();
                  $(element).tab('show');
              });
          }
      };
  });

    angular.module('mobyle').directive('activeLink', ['$location',
    function (location) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var clazz = attrs.activeLink;
                    var path = attrs.href;
                    path = path.substring(1); //hack because return path includes leading hash
                    scope.location = location;
                    scope.$watch('location.path()', function (newPath) {
                        if (path === newPath) {
                            element.parent().addClass(clazz);
                        } else {
                            element.parent().removeClass(clazz);
                        }
                    });
                }
            };
    }]);

  /**
   * @ngdoc directive
   * @name statusCc
   * @description
   *
   * The `statusCc` directive sets bootstrap class names to color the parent
   * element's backgroung and text.
   */
    angular.module('mobyle').directive('statusCc', [
    function () {
            return {
                restrict: 'A',
                scope: {
                    job: '=statusCc',
                    background: '=background',
                    text: '=text',
                },
                link: function (scope, element) {
                    var variant = '';
                    switch(scope.job.status){
                        case 'finished':
                            variant = 'success';
                            break;
                        case 'error':
                            variant = 'danger';
                            break;
                        case 'building':
                            variant = 'info';
                            break;
                        case 'updating':
                            variant = 'warning';
                            break;
                        default:
                            variant = 'info';
                    }
                    if(scope.text===true){
                        element.addClass('text-' + variant);
                    }
                    if(scope.background===true){
                        element.addClass('bg-' + variant);
                    }
                }
            };
    }]);

    angular.module('mobyle').directive('hiddable', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.css('position', 'relative');
                element.css('border-right', '1px solid #e5e5e5');
                var nextEl = element.next();
                var iEl = $('<i class="glyphicon glyphicon-chevron-left"></i>');
                var buttonEl = $('<button class="btn" style="width: 2em; position: absolute; top:0em; right: -2em; padding: 0;"></button>');
                element.append(buttonEl);
                buttonEl.append(iEl);
                var hiddableWidth;
                buttonEl.click(function () {
                    hiddableWidth = element.width();
                    element.children().css('overflow', 'hidden');
                    element.toggleClass('col-md-2 col-md-0');
                    nextEl.toggleClass('col-md-10 col-md-11');
                    iEl.toggleClass('glyphicon glyphicon-chevron-right glyphicon glyphicon-chevron-left');
                });
            }
        };
    });

    angular.module('mobyle').directive('mboutput', [

    function () {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'views/mboutput.html',
                scope: {
                    para: '=',
                    job: '='
                },
                link: function (scope, element) {
                    // switch the type of the input according to the parameter type...
                    // work in progress...
                    switch (scope.para.type._type) {
                    case 'StringType':
                    case 'FloatType':
                    case 'IntegerType':
                    case 'BooleanType':
                        scope.displayType = 'text';
                        if (scope.para.type.options && scope.para.type.options.length > 0) {
                            angular.forEach(scope.para.type.options, function (option) {
                                if (option.value === scope.job.inputs[scope.para.name].value) {
                                    scope.text = option.label;
                                }
                            });
                        } else {
                            scope.text = scope.job.inputs[scope.para.name].value;
                        }
                        break;
                    case 'FormattedType':
                        //text formats
                        scope.displayType = 'file';
                        break;
                    default:
                        scope.untranslated = true;
                    }
                    var infoEl = element.find('[data-content]');
                    infoEl.bind('mouseover', function () {
                        infoEl.popover('show');
                    });
                    infoEl.bind('mouseout', function () {
                        infoEl.popover('hide');
                    });
                }
            };
    }]);


    angular.module('mobyle').directive('mbinput', ['evalBoolFactory','$modal','ProjectData',
    function (evalBoolFactory, $modal, ProjectData) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'views/mbinput.html',
                scope: {
                    para: '=',
                    job: '=',
                    preload: '='
                },
                link: function (scope, element) {
                    // switch the type of the input according to the parameter type...
                    // work in progress...
                    switch (scope.para.type._type) {
                    case 'StringType':
                        if (scope.para.type.options && scope.para.type.options.length > 0) {
                            scope.select = true;
                            scope.options = [];
                            scope.para.type.options.forEach(function (item) {
                                scope.options.push({
                                    'label': item.label,
                                    'value': item.value
                                });
                            });
                        } else {
                            scope.itype = 'text';
                        }
                        break;
                    case 'FloatType':
                        scope.itype = 'number';
                        scope.step = 'any';
                        break;
                    case 'IntegerType':
                        scope.itype = 'number';
                        scope.step = '1';
                        break;
                    case 'BooleanType':
                        scope.select = true;
                        scope.options = [{
                            'label': 'yes',
                            'value': true
                        }, {
                            'label': 'no',
                            'value': false
                    }];
                        break;
                    case 'FormattedType':
                        //text formats
                        scope.textarea = true;
                        break;
                    default:
                        scope.untranslated = true;
                    }
                    if(scope.textarea){
                        scope.loadData = function(id){
                            ProjectData.raw(id).then(function (data) {
                                    scope.job.inputs[scope.para.name] = data.data;
                                });
                        };
                        scope.selectBookmark = function(){
                            var modalInstance = $modal.open({
                                templateUrl: 'views/dataSelect.html',
                                controller: 'DataSelectCtrl',
                                resolve: {
                                    para: function () {
                                        return scope.para;
                                    }
                                }
                            });
                            modalInstance.result.then(function (selectedItem) {
                                if (selectedItem) {
                                    // FIXME should not load data like this obviously,
                                    // but that's just to test controller communication.
                                    scope.loadData(selectedItem[0]._id);
                                }
                            });
                        };
                        if(scope.job.inputs[scope.para.name] && scope.job.inputs[scope.para.name].$oid){
                            scope.loadData(scope.job.inputs[scope.para.name]);
                        }
                    }
                    // initialize default value for the parameter in the model
                    if (!scope.job.inputs[scope.para.name]) {
                        scope.job.inputs[scope.para.name] = scope.para.type.
                        default;
                    }
                    // custom validation functions
                    scope.uiValidateString = '';
                    if (scope.para.ctrl) {
                        scope.uiValidateObj = {};
                        $.each(scope.para.ctrl, function (index, ctrlItem) {
                            scope['ctrls' + index] = {
                                'test': function ($value) {
                                    // manage 'value' key as the current parameter
                                    scope.job.inputs.value = $value;
                                    scope.job.inputs[scope.para.name] = $value;
                                    console.log(scope.para.name, $value, scope.para.type.
                                        default, evalBoolFactory(scope.job.inputs, scope.para.name)(ctrlItem.test));
                                    return evalBoolFactory(scope.job.inputs, scope.para.name)(ctrlItem.test);
                                },
                                'message': ctrlItem.message
                            };
                            scope.uiValidateObj['ctrls' + index] = 'ctrls' + index + '.test($value)';
                        });
                        scope.uiValidateString = JSON.stringify(scope.uiValidateObj);
                    }
                    // comments show/hide control
                    scope.showComment = false;
                    scope.toggleComment = function(){
                        scope.showComment = !scope.showComment;
                    };
                    var infoEl = element.find('[data-content]');
                    infoEl.bind('mouseover', function () {
                        infoEl.popover('show');
                    });
                    infoEl.bind('mouseout', function () {
                        infoEl.popover('hide');
                    });
                }
            };
    }]);

    angular.module('mobyle').directive('ifPrecond', ['evalBoolFactory',
    function (evalBoolFactory) {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    // compute if a precond applies for the display
                    // and to update the mandatory attribute of the para (if exists)
                    var precondApplies = evalBoolFactory(scope.job.inputs);
                    var mandatory = scope.para.mandatory;
                    var update = function (precond) {
                        var applies = precondApplies(precond);
                        if (applies) {
                            element.show();
                        } else {
                            element.hide();
                        }
                        scope.para.mandatory = (mandatory && applies);
                    };
                    scope.$watch('job.inputs', function () {
                        update(scope.para.precond);
                    }, true);
                }
            };
    }]);

    // recursive directive example
    // (from https://groups.google.com/forum/#!topic/angular/vswXTes_FtM)
    angular.module('mobyle').directive('recursive', function ($compile) {
        return {
            restrict: 'E',
            priority: 100000,
            compile: function (tElement) {
                var contents = tElement.contents().remove();
                var compiledContents;
                return function (scope, iElement) {
                    if (!compiledContents) {
                        compiledContents = $compile(contents);
                    }
                    iElement.append(
                        compiledContents(scope,
                            function (clone) {
                                return clone;
                            }));
                };
            }
        };
    });

    angular.module('mobyle').directive('mbformpara', ['mbsimple',
    function (mbsimple) {
            return {
                scope: {
                    para: '=',
                    job: '=',
                    showAdvanced: '='
                },
                link: function (scope) {
                    scope.mbsimple = mbsimple;
                },
                templateUrl: 'views/mbformpara.html'
            };
    }]);


    angular.module('mobyle').directive('mbjobpara', ['mbset',
    function (mbset) {
            return {
                scope: {
                    para: '=',
                    job: '=',
                },
                link: function (scope) {
                    scope.mbset = mbset;
                },
                templateUrl: 'views/mbjobpara.html'
            };
    }]);

    angular.module('mobyle').directive('servicesClassification', [

    function () {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                templateUrl: 'views/classification.html',
                controller: function ($scope, Classification) {
                    var getServices = function(node){
                        return node.services.map(
                            function(service){
                                return service.name;
                            }).concat(node.sublevels.map(function(n){
                                return getServices(n);
                            }).reduce(function(n1,n2){
                                return n1.concat(n2);
                            },[]));
                    };
                    $scope.getServicesNumber = function(node){
                        return _.unique(getServices(node)).length;
                    };
                    $scope.load = function (query) {
                        $scope.loading = true;
                        $scope.tree = null;
                        $scope.level = 0;
                        $scope.defaultToggleState = !query;
                        Classification.query({
                            key: 'topic',
                            filter: query
                        }, function (classification) {
                            $scope.tree = classification;
                            $scope.loading = false;
                        });
                    };
                    $scope.load();
                    $scope.$watch('query', function (newValue, oldValue) {
                        if ((!oldValue || oldValue.length < 3) && (!newValue || newValue.length < 3)) {
                            return;
                        } else if (!newValue || newValue.length < 3) {
                            $scope.load(null);
                        } else {
                            $scope.load(newValue);
                        }
                    });
                }
            };
    }]);

    angular.module('mobyle').directive('tree', [

        function () {
            return {
                templateUrl: 'views/tree.html',
                link: function (scope) {
                    scope.isService = function (tree) {
                        return tree.hasOwnProperty('version');
                    };
                    scope.level += 1;
                    scope.toggleState = scope.defaultToggleState && (scope.level > 1);
                    scope.toggle = function () {
                        scope.toggleState = !scope.toggleState;
                    };
                }
            };
    }]);

    angular.module('mobyle').directive('typeText', ['ServiceTypeTermRegistry',
    function (ServiceTypeTermRegistry) {
            return {
                restrict: 'E',
                replace: true,
                template: '<span class="text-muted" style="font-size: x-small;">{{dataTermLabel}} <span ng-if="formatTermLabel">({{formatTermLabel}})</span></span>',
                scope: {
                    type: '='
                },
                link: function (scope) {
                    scope.dataTermLabel = '';
                    scope.formatTermLabel = '';
                    ServiceTypeTermRegistry.dataTermsById().then(function (dataTermsById) {
                        var dataIds = $.makeArray(scope.type.data_terms);
                        scope.dataTermLabel = $.map(dataIds, function (dataId) {
                            if (dataTermsById[dataId]) {
                                return dataTermsById[dataId].name;
                            } else {
                                return dataId;
                            }
                        }).join(', ');
                    });
                    ServiceTypeTermRegistry.formatTermsById().then(function (formatTermsById) {
                        var formatIds = $.makeArray(scope.type.format_terms);
                        scope.formatTermLabel = $.map(formatIds, function (formatId) {
                            if (formatTermsById[formatId]) {
                                return formatTermsById[formatId].name;
                            } else {
                                return formatId;
                            }
                        }).join(', ');
                    });
                }
            };
    }]);

    angular.module('mobyle').directive('tinyTextFile', [

    function () {
            return {
                restrict: 'E',
                replace: true,
                require: 'ngModel',
                scope: {
                    'ngModel': '='
                },
                template: '<span class="btn-file btn">Load file...<input type="file" /></span>',
                link: function ($scope, element) {
                    var loadFile = function (evt) {
                        var result = '';
                        var files = evt.target.files; // FileList object
                        var chunkSize = 20000;
                        var readBlob = function (file, offset) {
                            var stop = offset + chunkSize - 1;
                            if (stop > (fileSize - 1)) {
                                stop = fileSize - 1;
                            }
                            var reader = new FileReader();
                            reader.onloadend = function(evt){
                                if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                                    result += evt.target.result;
                                    if (stop < fileSize - 1) {
                                        offset = offset + chunkSize;
                                        evt = null;
                                        readBlob(file, offset);
                                    } else {
                                        $scope.$apply(
                                            function () {
                                                $scope.ngModel.value = result;
                                                $scope.ngModel.name = file.name;
                                                $scope.ngModel.data.size = file.size;
                                            });
                                    }
                                }
                            };
                            var blob = file.slice(offset, stop + 1);
                            reader.readAsBinaryString(blob);
                        };
                        for (var i = 0, f; i < files.length; i++) {
                            f = files[i];
                            var fileSize = f.size;
                            readBlob(f, 0);
                        }
                    };
                    element.children().change(function (evt) {
                        loadFile(evt);
                    });
                }

            };
    }]);

    // utility directive to format correctly values for "number" inputs
    // which are not correctly handled by AngularJS
    // source: http://jsfiddle.net/SanderElias/qb44R/
    angular.module('mobyle').directive('input', function () {
        return {
            restrict: 'E',
            require: '?ngModel',
            link: function (scope, elem, attrs, ctrl) {
                if (attrs.type && attrs.type.toLowerCase() !== 'number') {
                    return;
                } //only augment number input!
                ctrl.$formatters.push(function (value) {
                    return value ? parseFloat(value) : null;
                });
            }
        };
    });

angular.module('mobyle').controller('WelcomeCtrl',
    function () {});

angular.module('mobyle').controller('NotificationCtrl',
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

angular.module('mobyle').controller('NotificationCenterCtrl',
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

angular.module('mobyle').controller('MyCtrl',
    function (LoginManager, $scope, $log, CurrentUser) {
      $scope.user = CurrentUser.get();
    });

angular.module('mobyle').controller('LoginCtrl',
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

angular.module('mobyle').controller('ServicesCtrl',
    function ($scope, Service) {
        $scope.services = Service.query();
        $scope.listDisplay = 'list';
    });

angular.module('mobyle').controller('ServiceDetailCtrl',
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

angular.module('mobyle').controller('DataTermsCtrl',
    function ($scope, DataTerm) {
        $scope.terms = DataTerm.query();
        $scope.listDisplay = 'list';
        $scope.object = 'dataterm';
    });

angular.module('mobyle').controller('DataTermDetailCtrl',
    function ($scope, $routeParams, DataTerm) {
        $scope.term = DataTerm.get({
            id: $routeParams.dataTermId
        });
        $scope.object = 'dataterm';
    });

angular.module('mobyle').controller('FormatTermsCtrl',
    function ($scope, FormatTerm) {
        $scope.terms = FormatTerm.query();
        $scope.listDisplay = 'list';
        $scope.object = 'formatterm';
    });

angular.module('mobyle').controller('FormatTermDetailCtrl',
    function ($scope, $routeParams, FormatTerm) {
        $scope.term = FormatTerm.get({
            id: $routeParams.formatTermId
        });
        $scope.object = 'formatterm';
    });

angular.module('mobyle').controller('ProjectsCtrl',
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

angular.module('mobyle').controller('JobsCtrl',
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

angular.module('mobyle').controller('JobDetailCtrl',
    function ($scope, job, mbset) {
        $scope.job = job;
        $scope.mbset = mbset;
        $scope.showAdvanced = true;
    });



angular.module('mobyle').controller('ProjectEditPropertiesCtrl',
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

angular.module('mobyle').controller('DatasCtrl',
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

angular.module('mobyle').controller('DataEditCtrl',
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

angular.module('mobyle').controller('DataSelectCtrl',
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

angular.module('mobyle').controller('mobyleCtrl',
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


angular.module('mobyle').controller('AdminCtrl',
    function ($scope, $log, User, Job, LoginManager, MobyleConfig) {
      $scope.$on('LoginManager.update', function (event, login) {
          $scope.user = login.user;
          $scope.admin = login.admin;
      });
      $scope.users = [];
      $scope.update_users = function () {
          $log.info('Admin: querying list of users...');
          $scope.users = User.list();
      };
      $scope.update_users();
      $scope.update_jobs = function () {
          $log.info('Admin: querying list of jobs...');
          var running = 0;
          var pending = 0;
          var jobs = Job.list();
          jobs.$promise.then(function(jobs){
              for(var i=0;i<jobs.length;i++){
                if(jobs[i].isPending()) {
                  pending += 1;
                }
                else if(jobs[i].isRunning()) {
                  running += 1;
                }
              }
              $scope.jobs_pending = pending;
              $scope.jobs_running = running;
          });
      };
      $scope.update_jobs();

      $scope.config = {};
      $scope.update_config = function () {
          $log.info('Admin: querying config...');
          var config = MobyleConfig.filter({active: true});
          config.$promise.then(function(resp){
            $scope.config = resp[0];
          });

      };
      $scope.update_config();

    });

angular.module('mobyle').controller('AdminConfigCtrl',
    function ($scope, $log, MobyleConfig) {
      $scope.config = {};
      $scope.update = function () {
          $log.info('Admin: querying config...');
          var config = MobyleConfig.filter({active: true});
          config.$promise.then(function(resp){
            $scope.config = resp[0];
          });

      };
      $scope.update();
    });

angular.module('mobyle').controller('AdminJobCtrl',
    function ($scope, $log, Job, $templateCache) {
      $scope.jobs = [];
      $scope.pagedJobData = [];

      $scope.setPagingData = function(data, pageSize, page){
          if (data===undefined){
              return;
          }
          $scope.pagedJobData = data.slice((page - 1) * pageSize, page * pageSize);
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      };

      $scope.update = function () {
          $log.info('Admin: querying jobs...');
          var jobs = Job.list();
          jobs.$promise.then(function(resp){
            $scope.jobs = resp;
            $scope.totalservices = resp.length;
            $scope.setPagingData($scope.jobs, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);

          });

      };

      $scope.pagingOptions = {
          pageSizes: [5, 10, 20],
          pageSize: 10,
          currentPage: 1
      };

      $scope.$watch('pagingOptions', function () {
            $scope.setPagingData($scope.jobs, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
      }, true);

      $scope.selectedRows = [];
      $scope.jobsGridOptions = {
          data: 'pagedJobData',
          showFooter: true,
          totalServerItems:'totalServerItems',
          enablePaging: true,
          pagingOptions: $scope.pagingOptions,
          enableRowSelection: true,
          multiSelect: false,
          columnDefs: [{
                  field: 'name',
                  displayName: 'Name',
                  width: '*'
          },
              {
                  field: 'status',
                  displayName: 'Status',
                  width: '**'
          },
          {
              field: 'owner',
              displayName: 'Owner',
              width: '**'
          },
          {
              field: 'test',
              displayName: 'Actions',
              width: '**',
              cellTemplate: $templateCache.get('jobGrid_ActionsCell.html')
          }
          ],
          selectedItems:$scope.selectedRows,
          afterSelectionChange: function(){
              // clicking on a row selects it
              //$scope.ok();
          }
      };


      $scope.update();
    });

angular.module('mobyle').controller('AdminServiceCtrl',
    function ($scope, $log, Service, $templateCache) {
        $scope.services = [];
        $scope.pagedServiceData = [];

        $scope.setPagingData = function(data, pageSize, page){
            if (data===undefined){
                return;
            }
            $scope.pagedServiceData = data.slice((page - 1) * pageSize, page * pageSize);
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.update = function () {
            $log.info('Admin: querying services...');
            //var services = Service.list();
            var services = Service.query();
            services.$promise.then(function(resp){
              $scope.services = resp;
              $scope.totalservices = resp.length;
              $scope.setPagingData($scope.services, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);

            });

        };

        $scope.pagingOptions = {
            pageSizes: [5, 10, 20],
            pageSize: 10,
            currentPage: 1
        };

        $scope.$watch('pagingOptions', function () {
              $scope.setPagingData($scope.services, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
        }, true);

        $scope.selectedRows = [];
        $scope.servicesGridOptions = {
            data: 'pagedServiceData',
            showFooter: true,
            totalServerItems:'totalServerItems',
            enablePaging: true,
            pagingOptions: $scope.pagingOptions,
            enableRowSelection: true,
            multiSelect: false,
            columnDefs: [{
                    field: 'name',
                    displayName: 'Name',
                    width: '*'
            },
                {
                    field: 'version',
                    displayName: 'Version',
                    width: '**'
            },
            {
                field: 'title',
                displayName: 'Title',
                width: '**'
            },
            {
                field: 'description',
                displayName: 'Description',
                width: '**'
            },
            {
                field: 'test',
                displayName: 'Actions',
                width: '**',
                cellTemplate: $templateCache.get('serviceGrid_ActionsCell.html')
            }
            ],
            selectedItems:$scope.selectedRows,
            afterSelectionChange: function(){
                // clicking on a row selects it
                //$scope.ok();
            }
        };


        $scope.update();
    });

angular.module('mobyle').controller('AdminUserCtrl',
    function ($scope, $log, User, $templateCache) {
      $scope.users = [];
      $scope.pagedUserData = [];

      $scope.setPagingData = function(data, pageSize, page){
          if (data===undefined){
              return;
          }
          $scope.pagedUserData = data.slice((page - 1) * pageSize, page * pageSize);
          if (!$scope.$$phase) {
              $scope.$apply();
          }
      };

      $scope.update = function () {
          $log.info('Admin: querying users...');
          var users = User.list();
          users.$promise.then(function(resp){
            $scope.users = resp;
            $scope.totalusers = resp.length;
            $scope.setPagingData($scope.users, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);

          });

      };

      $scope.pagingOptions = {
          pageSizes: [5, 10, 20],
          pageSize: 10,
          currentPage: 1
      };

      $scope.$watch('pagingOptions', function () {
            $scope.setPagingData($scope.users, $scope.pagingOptions.pageSize, $scope.pagingOptions.currentPage);
      }, true);

      $scope.selectedRows = [];
      $scope.usersGridOptions = {
          data: 'pagedUserData',
          showFooter: true,
          totalServerItems:'totalServerItems',
          enablePaging: true,
          pagingOptions: $scope.pagingOptions,
          enableRowSelection: true,
          multiSelect: false,
          columnDefs: [{
                  field: 'email',
                  displayName: 'Email',
                  width: '*'
          },
              {
                  field: 'groups',
                  displayName: 'Groups',
                  width: '**'
          },
          {
              field: 'test',
              displayName: 'Actions',
              width: '**',
              cellTemplate: $templateCache.get('userGrid_ActionsCell.html')
          }
          ],
          selectedItems:$scope.selectedRows,
          afterSelectionChange: function(){
              // clicking on a row selects it
              //$scope.ok();
          }
      };

      $scope.deleteData = function (data) {
        if(data.admin) {
          $scope.alerts.push({
              type: 'danger',
              msg: 'User is an admin cannot delete it'
          });
        }
        else {
          data.$delete().then(function () {
              $scope.users.splice($scope.users.indexOf(data), 1);
          }, function (errorResponse) {
              $scope.alerts.push({
                  type: 'danger',
                  msg: errorResponse.data.detail
              });
          });
        }
      };


      $scope.update();



    });