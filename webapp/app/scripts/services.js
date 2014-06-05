'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('mobyle.services', ['ngResource']);

angular.module('mobyle.services').value('mbsimple', function (para) {
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

angular.module('mobyle.services').value('mbset', function (para, valuesMap) {
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

angular.module('mobyle.services').factory('mfResource', function ($resource, $http) {
    function MFResourceFactory(collectionName, paramDefaults, actions) {
        // default url template, used for everything *but* search
        var route = '/' + collectionName.toLowerCase() + 's/:id';
        // url template used for search/filter
        var filterUrl = '/' + collectionName.toLowerCase() + "s?";
        for (var key in paramDefaults) {
            filterUrl += "Search" + collectionName + "[" + key + "]=:" + key + "&";
        }
        // custom function to build request body
        var transformRequestFactory = function () {
            return function (data) {
                var requestObject = {};
                var serialize = function (prefix, data) {
                    if (data instanceof Array) {
                        $.each(data, function (index, value) {
                            serialize(prefix + '[' + index + ']', data[index]);
                        });
                    } else if (data instanceof Object) {
                        if (data.$oid) {
                            requestObject[prefix] = data.$oid;
                        } else {
                            for (var prop in data) {
                                if (data.hasOwnProperty(prop)) {
                                    serialize(prefix + '[' + prop + ']', data[prop]);
                                }
                            }
                        }
                    } else {
                        if (data != null) {
                            requestObject[prefix] = data;
                        }
                    }
                }
                serialize(collectionName, data);
                return $.param(requestObject);
            }
        }
        var transformResponse = function (data) {
            var json_data = JSON.parse(data);
            return json_data[json_data.object];
        }
        var updateAction = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'method': 'PUT',
            transformRequest: transformRequestFactory(''),
            transformResponse: transformResponse
        };
        var createAction = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'method': 'POST',
            transformRequest: transformRequestFactory(''),
            transformResponse: transformResponse,
            params: {}
        };
        var listAction = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'method': 'GET',
            transformRequest: transformRequestFactory(''),
            isArray: true
        };
        var filterAction = {
            url: filterUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'method': 'GET',
            transformRequest: transformRequestFactory('Search'),
            isArray: true
        };
        var resource = $resource(route, paramDefaults || {},
            $.extend({
                get: {
                    method: 'GET',
                    transformResponse: function (data) {
                        var json_data = JSON.parse(data);
                        return json_data[json_data.object];
                    }
                },
                list: listAction,
                filter: filterAction,
                create: createAction,
                update: updateAction
            }, actions)
        );
        // define save action to use create or update
        resource.prototype.$save = function () {
            if (!this._id) {
                return this.$create();
            } else {
                return this.$update();
            }
        };
        // get creation date from objectid
        resource.prototype.getCreationDate = function () {
            if (this._id) {
                var id = this._id.$oid;
                var timehex = id.substring(0,8);
                var secondsSinceEpoch = parseInt(timehex, 16);
                var dt = new Date(secondsSinceEpoch*1000);
                return dt;
            }else{
                return null;
            }
        };
        // define delete action that sends only the id of the object to be deleted
        resource.prototype.$delete = function () {
            return $http.delete('/' + collectionName.toLowerCase() + 's/' + this._id.$oid);
        }
        return resource;
    }
    return MFResourceFactory;
});

angular.module('mobyle.services').factory('Classification', function ($resource) {
    return $resource('/services/by_:key', {}, {
        query: {
            isArray: false
        }
    });
});

angular.module('mobyle.services').value('serviceInputsByName', function(){
        var inputsByName = {};
        var explore = function(para){
            if(para.children){
                angular.forEach(para.children, function(childPara, index){
                    explore(childPara);
                });
            }else{
                inputsByName[para.name]=para;
            }
        }
        explore(this.inputs);
        return inputsByName;
    });

angular.module('mobyle.services').factory('Service', function ($resource, serviceInputsByName) {
    var resource = $resource('/services/:id', {}, {
        get: {
            method: 'get',
            url: '/api/services/:id/:public_name/:version',
            transformResponse: function (data) {
                var json_data = JSON.parse(data);
                return json_data[json_data.object];
            }
        }
    });
    resource.prototype.inputsByName = serviceInputsByName;
    return resource;
});

angular.module('mobyle.services').factory('DataTerm', function (mfResource) {
    return mfResource('DataTerm');
});

angular.module('mobyle.services').factory('FormatTerm', function (mfResource) {
    return mfResource('FormatTerm');
});

angular.module('mobyle.services').factory('ServiceTypeTerm', function (mfResource) {
    var res = mfResource('ServiceTypeTerm');
    return res;
});

angular.module('mobyle.services').factory('ServiceTypeTermRegistry', function (ServiceTypeTerm, FormatTerm, $q) {
    // declare promises
    var dataTermsByIdP = $q.defer();
    var formatTermsByIdP = $q.defer();
    var termsByIdP = $q.defer();
    var dataTermsP = $q.defer();
    var formatTermsP = $q.defer();
    var termsP = $q.defer();
    // call the server method
    var dataQuery = ServiceTypeTerm.query({});
    // process the server response to cache the results
    dataQuery.$promise.then(function(resp){
        var dataTermsById = {};
        var formatTermsById = {};
        var termsById = {};
        var dataTerms = [];
        var formatTerms = [];
        var terms = [];
        angular.forEach(resp, function(item){
            dataTermsById[item['term_id']] = item;
            dataTerms.push(item);
            terms.push(item);
            angular.forEach(item['format_terms'],
                            function(formatTerm){
                                if(!formatTermsById[formatTerm.term_id]){
                                    formatTermsById[formatTerm.term_id] = formatTerm;
                                    formatTerms.push(formatTerm);
                                    terms.push(formatTerm);
                                }
                            });
        });
        termsById = dataTermsById;
        angular.extend(termsById, formatTermsById);
        dataTermsByIdP.resolve(dataTermsById);
        formatTermsByIdP.resolve(formatTermsById);
        termsByIdP.resolve(termsById);
        dataTermsP.resolve(dataTerms);
        formatTermsP.resolve(formatTerms);
        termsP.resolve(terms);
    });
    return {
        dataTermsById: function () {
            // data terms in an object
            return dataTermsByIdP.promise;
        },
        formatTermsById: function() {
            // format terms in an object
            return formatTermsByIdP.promise;
        },
        termsById: function(){
            // data and format terms in an object
            return termsByIdP.promise;
        },
        dataTerms: function () {
            // data terms in a list
            return dataTermsP.promise;
        },
        formatTerms: function() {
            // format terms in a list
            return formatTermsP.promise;
        },
        terms: function(){
            // data and format terms in a list
            return termsP.promise;
        }
    }
});

angular.module('mobyle.services').factory('User', function (mfResource) {
    return mfResource('User');
});

angular.module('mobyle.services').factory('Project', function (mfResource) {
    var defaultParams = {
        'name': '@name',
        'description': '@description',
        'public': '@public',
        'owner': '@owner',
        'users': '@users',
        'id': '@_id.$oid'
    }

    return mfResource('Project', defaultParams);
});

angular.module('mobyle.services').factory('Job', function (mfResource, $http, $parse, Service, serviceInputsByName) {

    var paramDefaults = {
        'id': '@_id.$oid',
        'status': '@status',
        'project': '@project._id.$oid',
        'service': '@service._id.$oid'
    }

    var jobResource = mfResource('Job', paramDefaults, {
        list_by_project: {
            'method': 'GET',
            'url': '/api/project/:project_id/jobs',
            isArray: true
        },
        get: {
            method: 'get',
            url: '/api/jobs/:id'
        }
    });

    jobResource.prototype.$create = function () {
        // use a custom method for create action because
        // we need to use FormData to upload files
        var item = this;
        return $http.post('/api/projectjobs', this, {
            transformRequest: function (data, headersGetter) {
                // use FormData to allow file uploads
                var fd = new FormData();
                // job project container
                fd.append('project', data.project._id.$oid);
                // service
                fd.append('service', data.service._id.$oid);
                var inputsByName = data.service.inputsByName();
                // job input parameters
                angular.forEach(data.inputs, function (value, key) {
                    // if value==null then it is not set
                    if(value!=null){
                        // if value == default value do not send the value
                        if((inputsByName[key].type.default==null) ||
                           (inputsByName[key].type.default &&
                           value!=inputsByName[key].type.default)){
                            var extractedParam = (value &&
                                                  value.charAt &&
                                                  value.charAt(0) == '@') ?
                                $parse(value.substr(1))(data) : value;
                            fd.append('input:'+key, extractedParam);
                        }
                    }
                })
                return fd;
            },
            transformResponse: function (data, header) {
                var wrapped = new jobResource(angular.fromJson(data));
                return wrapped;
            },
            headers: {
                'Content-Type': undefined
            }
        }).success(function (data, status) {
            item._id = data._id;
        });
    }
    
    jobResource.prototype.userName = function(){
        if (this.name){
            return this.name;
        }else{
            return this.service.public_name;
        }
    }
    jobResource.prototype.getReplayJob = function(){
        // get a new Job for replay functionality
        var job = {};
        angular.copy(this,job);
        delete job['_id'];
        var newInputs = {};
        // FIXME? that's a dirty way for handling custom object methods...
        job.service.inputsByName = serviceInputsByName;
        angular.forEach(job.inputs, function (value, key) {
            // if value==null then it is not set
            if(value!=null && value.type){
                // if value == default value do not send the value
                if((value.type.default==null) ||
                   (value.type.default &&
                   value.value!=value.type.default)){
                    //FIXME only handling data "by value" for now, not files
                    switch (value.type._type) {
                        case 'IntegerType':
                            newInputs[key] = parseInt(value.value,10);
                            break;
                        case 'FloatType':
                            newInputs[key] = parseFloat(value.value);
                            break;
                        default:
                            newInputs[key] = value.value;
                            break;
                    }
                    
                }
            }
        });
        job.inputs = newInputs;
        return job;
    }
    
    return jobResource;
});


angular.module('mobyle.services').factory('ProjectData', function (mfResource, $http, $parse) {

    var paramDefaults = {
        'name': '@name',
        'description': '@description',
        'project': '@project',
        'tags': '@tags',
        'id': '@_id.$oid',
        'value': '@value',
        'format_terms': '@data.type.format_terms',
        'data_terms': '@data.type.data_terms'
    }
    var projectDataResource = mfResource('ProjectData', paramDefaults, {
        update: {
            'method': 'PUT',
            'url': '/api/projectdata/:id'
        },
        list_by_project: {
            'method': 'GET',
            'url': '/api/project/:project_id/data',
            isArray: true
        }
    });

    projectDataResource.prototype.$create = function () {
        // use a custom method for create action because
        // we need to use FormData to upload files
        var item = this;
        return $http.post('/api/projectdata', this, {
            transformRequest: function (data, headersGetter) {
                // use FormData to allow file uploads
                var fd = new FormData();
                // fill the properties to send from paramDefaults
                // shamelessly stolen from angular-resource.js
                angular.forEach(paramDefaults, function (value, key) {
                    var extractedParam = value &&
                        value.charAt &&
                        value.charAt(0) == '@' ?
                        $parse(value.substr(1))(data) : value;
                    fd.append(key, extractedParam);
                })
                return fd;
            },
            transformResponse: function (data, header) {
                var wrapped = new projectDataResource(angular.fromJson(data));
                return wrapped;
            },
            headers: {
                'Content-Type': undefined
            }
        }).success(function (data, status) {
            item._id = data._id;
        });
    }
    return projectDataResource;
});

angular.module('mobyle.services').factory('CurrentProject', function (Project, $rootScope) {
    var currentProject = {};

    function setId(currentProjectId) {
        currentProject = Project.get({
            id: currentProjectId
        });
        $rootScope.$broadcast('CurrentProject.update', currentProject);
    }

    function get() {
        return currentProject;
    }
    return {
        setId: setId,
        get: get
    }
});

angular.module('mobyle.services').factory('CurrentUser', function (User, LoginManager, $rootScope, $log) {
    var user = new User();
    var load = function (email) {
        $log.info("load current user info for " + email);
        User.query({
                'email': email
            },
            function (users) {
                user = users[0];
                $log.debug(users);
                $log.info("current user loaded: " + user.email);
            });
    }
    $rootScope.$on('LoginManager.update', function (event, login) {
        load(login.email);
    });
    load(LoginManager.login.user);
    var get = function () {
        $log.info("returning current user :" + user.email);
        return user;
    }
    return {
        'get': get
    }
});

angular.module('mobyle.services').factory('Login', function ($resource) {
    function LoginFactory(authName) {
        return $resource('/auth/login/' + authName, {}, {});
    }
    return LoginFactory;
});

angular.module('mobyle.services').factory('Logout', function ($resource) {
    function LogoutFactory(authName) {
        return $resource('/auth/logout', {}, {});
    }
    return LogoutFactory;
});

angular.module('mobyle.services').factory('PasswordResetRequest', function ($resource) {
    function PasswordResetQuestFactory(authName) {
        return $resource('/auth/password/reset', {
            username: authName
        }, {});
    }
    return PasswordResetQuestFactory;
});

angular.module('mobyle.services').factory('PasswordReset', function ($resource) {
    function PasswordResetQuestFactory(userToken, userNewPassword) {
        return $resource('/auth/password', {
            token: userToken,
            password: userNewPassword
        }, {});
    }
    return PasswordResetQuestFactory;
});

/**
 *   Login controller is used at multiple places (global + login page).
 *   USe this service to store login process elements and notify controllers on update
 */
angular.module('mobyle.services').factory('LoginManager', function ($rootScope) {

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
        }
    };
});

angular.module('mobyle.services').factory('NotificationList', function (mfResource, $http) {
    return {
        read_list: function(id_list, callback) {
            $http.put('/api/notifications/list', {'list': id_list, 'read': true}, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        },
        delete_list: function(id_list, callback) {
            $http.post('/api/notifications/delete',{'list': id_list}, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        },
        notify: function(notification, callback) {
            $http.post('/api/notifications/list', { 'project': notification.project._id.$oid, 'notification': notification}, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
        }
    }
});


angular.module('mobyle.services').factory('Notification', function (mfResource, $http) {
    return mfResource('Notification',
        {
        'id': '@_id.$oid',
        'read': '@read',
        'user': '@user',
        'message': '@message',
        'type': '@type'
        },
        {
        /*
        read_list: {
            'method': 'PUT',
            'url': '/api/notifications/list'
        },
        delete_list: {
            'method': 'DELETE',
            'url': '/api/notifications/list'
        },
        notify: {
            'method': 'POST',
            'url': '/api/notifications/send'
            }
        */
        });
    /*
    return  {
        unread: function(callback) {
            $http.get('/api/notification/pending').success(callback);
            },
        read: function(id, callback) {
            $http.put('/notifications/'+id, "Notification[read]=true", {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).success(callback);
            },
        query: mfResource('Notification').query,
        read_list: function(ids, callback) {
            console.log("mark read list");
            console.log(ids);
            },
        delete_list: function(ids, callback) {
            console.log("delete list");
            console.log(ids);
            }
    };
    */
});

angular.module('mobyle.services').value('evalBoolFactory', function (values) {
    // computes a boolean expression comprised of a combination of
    // comparison and logical operators over a set of values
    var evalBoolFactory = function (expr) {
        if (!expr) {
            return true;
        }
        var res = true;
        if(typeof expr == 'string'){
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
                        if (values[key] != value) {
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
                                    res = $.inArray(values[key], operand)!=-1;
                                    break;
                                case '#nin':
                                    res = $.inArray(values[key], operand)==-1;
                                    break;
                                case '#ne':
                                    res = (values[key] != operand);
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
    }
    return evalBoolFactory;
});