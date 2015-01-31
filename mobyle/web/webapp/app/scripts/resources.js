/*global $:false, _:false, angular:false, FormData */
/*jslint browser: true, indent: 4, vars: true, nomen: true */
(function () {
    'use strict';

    function mfResource($resource, $http) {
        function MFResourceFactory(collectionName, paramDefaults, actions) {
            // default url template, used for everything *but* search
            var route = '/' + collectionName.toLowerCase() + 's/:id',
                // url template used for search/filter
                filterUrl = '/' + collectionName.toLowerCase() + 's?';
            angular.forEach(paramDefaults, function (value, key) {
                filterUrl += 'Search' + collectionName + '[' + key + ']=:' + key + '&';
            });
            // custom function to build request body
            function transformRequestFactory() {
                return function (data) {
                    var requestObject = {};
                    function serialize(prefix, data) {
                        if (data instanceof Array) {
                            $.each(data, function (index) {
                                serialize(prefix + '[' + index + ']', data[index]);
                            });
                        } else if (data instanceof Object) {
                            if (data.$oid) {
                                requestObject[prefix] = data.$oid;
                            } else {
                                angular.forEach(data, function (value, key) {
                                    if (data.hasOwnProperty(key)) {
                                        serialize(prefix + '[' + key + ']', value);
                                    }
                                });
                            }
                        } else {
                            if (data !== null) {
                                requestObject[prefix] = data;
                            }
                        }
                    }
                    serialize(collectionName, data);
                    return $.param(requestObject);
                };
            }
            function transformResponse(data) {
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
            
            resource.prototype.reload = function(){
                if (this._id){
                    return resource.get({'id':this._id.$oid});
                }
            };
            
            // get creation date from objectid
            resource.prototype.getCreationDate = function () {
                if (this._id) {
                    var id = this._id.$oid;
                    var timehex = id.substring(0, 8);
                    var secondsSinceEpoch = parseInt(timehex, 16);
                    var dt = new Date(secondsSinceEpoch * 1000);
                    return dt;
                } else {
                    return null;
                }
            };
            // define delete action that sends only the id of the object to be deleted
            resource.prototype.$delete = function () {
                return $http.delete('/' + collectionName.toLowerCase() + 's/' + this._id.$oid);
            };
            return resource;
        }
        return MFResourceFactory;
    }

    function DataTerm(mfResource) {
        return mfResource('DataTerm');
    }

    function FormatTerm(mfResource) {
        return mfResource('FormatTerm');
    }

    function ServiceTypeTerm(mfResource) {
        return mfResource('ServiceTypeTerm');
    }

    function Classification($resource) {
        return $resource('/services/by_:key', {}, {
            query: {
                isArray: false
            }
        });
    }

    function ServiceInputsByName() {
        var inputsByName = {};
        var explore = function (para) {
            if (para.children) {
                angular.forEach(para.children, function (childPara) {
                    explore(childPara);
                });
            } else {
                inputsByName[para.name] = para;
            }
        };
        explore(this.inputs);
        return inputsByName;
    }

    function Service($resource) {
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
        resource.prototype.inputsByName = ServiceInputsByName;
        return resource;
    }

    function Job(mfResource, $http, $parse) {
        var paramDefaults = {
            'id': '@_id.$oid',
            'status': '@status',
            'project': '@project._id.$oid',
            'service': '@service._id.$oid'
        };
        var JobResource = mfResource('Job', paramDefaults, {
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

        JobResource.prototype.$create = function () {
            // use a custom method for create action because
            // we need to use FormData to upload files
            var item = this;
            return $http.post('/api/projectjobs', this, {
                transformRequest: function (data) {
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
                        if (value !== null && inputsByName[key]) {
                            // if value == default value do not send the value
                            if ((inputsByName[key].type.default === null) ||
                                    (inputsByName[key].type.default !== null &&
                                    value !== inputsByName[key].type.default)) {
                                var extractedParam = (value &&
                                        value.charAt &&
                                        value.charAt(0) === '@') ?
                                            $parse(value.substr(1))(data) : value;
                                fd.append('input:' + key, extractedParam);
                            }
                        }
                    });
                    return fd;
                },
                transformResponse: function (data) {
                    var wrapped = new JobResource(angular.fromJson(data));
                    return wrapped;
                },
                headers: {
                    'Content-Type': undefined
                }
            }).success(function (data) {
                item._id = data._id;
            });
        };

        JobResource.prototype.userName = function () {
            if (this.name) {
                return this.name;
            } else {
                return this.service.public_name;
            }
        };

        var preparingStatusCodes = ['to be built', 'building', 'to be submitted', 'submitting'];
        
        var runningStatusCodes = ['submitted', 'updating', 'running', 'pending'];

        var pausedStatusCodes = ['pause', 'hold'];

        var finishedStatusCodes = ['finished', 'error', 'killed'];
        
        JobResource.prototype.isPreparing = function () {
            return preparingStatusCodes.indexOf(this.status)>-1;
        };        

        JobResource.prototype.isRunning = function () {
            return runningStatusCodes.indexOf(this.status)>-1;
        };

        JobResource.prototype.isPaused = function () {
            return pausedStatusCodes.indexOf(this.status)>-1;
        };

        JobResource.prototype.isFinished = function () {
            return finishedStatusCodes.indexOf(this.status)>-1;
        };

        JobResource.prototype.getReplayJob = function () {
            // get a new Job for replay functionality
            var job = {};
            angular.copy(this, job);
            delete job._id;
            var newInputs = {};
            // FIXME? that's a dirty way for handling custom object methods...
            job.service.inputsByName = ServiceInputsByName;
            angular.forEach(job.inputs, function (value, key) {
                // if value==null then it is not set
                if (value !== null && value.type) {
                    // if value == default value do not send the value
                    if ((value.type.default === null) ||
                            (value.type.default !== null &&
                            value.value !== value.type.default)) {
                        switch (value.type._type) {
                        case 'IntegerType':
                            newInputs[key] = parseInt(value.value, 10);
                            break;
                        case 'FloatType':
                            newInputs[key] = parseFloat(value.value);
                            break;
                        case 'BooleanType':
                            newInputs[key] = JSON.parse(value.value);
                            break;
                        default:
                            newInputs[key] = value.value;
                            break;
                        }

                    }
                } else if (value !== null && value._id) {
                    newInputs[key] = value._id;
                }
            });
            job.inputs = newInputs;
            return job;
        };

        return JobResource;
    }

    function ServiceTypeTermRegistry(ServiceTypeTerm, FormatTerm, $q) {
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
        dataQuery.$promise.then(function (resp) {
            var dataTermsById = {};
            var formatTermsById = {};
            var termsById = {};
            var dataTerms = [];
            var formatTerms = [];
            var terms = [];
            angular.forEach(resp, function (item) {
                dataTermsById[item.term_id] = item;
                dataTerms.push(item);
                terms.push(item);
                angular.forEach(item.format_terms,
                    function (formatTerm) {
                        if (!formatTermsById[formatTerm.term_id]) {
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
            formatTermsById: function () {
                // format terms in an object
                return formatTermsByIdP.promise;
            },
            termsById: function () {
                // data and format terms in an object
                return termsByIdP.promise;
            },
            dataTerms: function () {
                // data terms in a list
                return dataTermsP.promise;
            },
            formatTerms: function () {
                // format terms in a list
                return formatTermsP.promise;
            },
            terms: function () {
                // data and format terms in a list
                return termsP.promise;
            }
        };
    }

    function MobyleConfig(mfResource) {
        var paramDefaults = {
            'id': '@_id.$oid',
        };
        return mfResource('MobyleConfig', paramDefaults);
    }

    function User(mfResource) {
        var paramDefaults = {
            'id': '@_id.$oid',
        };
        return mfResource('User', paramDefaults);
    }

    function Project(mfResource) {
        var defaultParams = {
            'name': '@name',
            'description': '@description',
            'public': '@public',
            'owner': '@owner',
            'users': '@users',
            'id': '@_id.$oid'
        };
        return mfResource('Project', defaultParams);
    }

    function ProjectData(mfResource, $http, $parse, $filter) {

        var paramDefaults = {
            'name': '@name',
            'description': '@description',
            'project': '@project',
            'tags': '@tags',
            'id': '@_id.$oid',
            'value': '@value',
            'format_terms': '@data.type.format_terms',
            'data_terms': '@data.type.data_terms'
        };

        var ProjectDataResource = mfResource('ProjectData', paramDefaults, {
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

        ProjectDataResource.listByProject = function (project, type) {
            // return the list of project data
            // can be filtered using a potential target type
            return ProjectDataResource.list_by_project({
                'project_id': project._id.$oid
            }).$promise.then(function (dataList) {
                if (type) {
                    // TODO: refactor filter function as a service
                    // TODO: filter using formats (commented currently)
                    // TODO: take the formats hierarchy into account
                    dataList = $filter('filter')(dataList, function (dataItem) {
                        if (_.intersection(dataItem.data.type.data_terms, type.data_terms).length===0)
                        //||  (_.intersection(dataItem.data.type.format_terms, type.format_terms).length==0)
                            {
                                return false;
                            } else {
                                return true;
                            }
                    });
                }
                return dataList;
            });
        };

        ProjectDataResource.prototype.$create = function () {
            // use a custom method for create action because
            // we need to use FormData to upload files
            var item = this;
            return $http.post('/api/projectdata', this, {
                transformRequest: function (data) {
                    // use FormData to allow file uploads
                    var fd = new FormData();
                    // fill the properties to send from paramDefaults
                    // shamelessly stolen from angular-resource.js
                    angular.forEach(paramDefaults, function (value, key) {
                        var extractedParam = value &&
                            value.charAt &&
                            value.charAt(0) === '@' ?
                                    $parse(value.substr(1))(data) : value;
                        fd.append(key, extractedParam);
                    });
                    return fd;
                },
                transformResponse: function (data) {
                    var wrapped = new ProjectDataResource(angular.fromJson(data));
                    return wrapped;
                },
                headers: {
                    'Content-Type': undefined
                }
            }).success(function (data) {
                item._id = data._id;
            });
        };

        ProjectDataResource.raw = function (id) {
            // retrieve the raw data for a given project Data
            return $http.get('/api/projectdata/' + id.$oid + '/raw');
        };

        return ProjectDataResource;
    }

    function Login($resource) {
        function LoginFactory(authName) {
            return $resource('/auth/login/' + authName, {}, {});
        }
        return LoginFactory;
    }

    function Logout($resource) {
        function LogoutFactory() {
            return $resource('/auth/logout', {}, {});
        }
        return LogoutFactory;
    }

    function PasswordResetRequest($resource) {
        function PasswordResetQuestFactory(authName) {
            return $resource('/auth/password/reset', {
                username: authName
            }, {});
        }
        return PasswordResetQuestFactory;
    }

    function PasswordReset($resource) {
        function PasswordResetFactory(userToken, userNewPassword) {
            return $resource('/auth/password', {
                token: userToken,
                password: userNewPassword
            }, {});
        }
        return PasswordResetFactory;
    }

    function Notification(mfResource) {
        return mfResource('Notification', {
            'id': '@_id.$oid',
            'read': '@read',
            'user': '@user',
            'message': '@message',
            'type': '@type'
        });
    }

    function NotificationsList(mfResource, $http) {
        return {
            read_list: function (id_list) {
                $http.put('/api/notifications/list', {
                    'list': id_list,
                    'read': true
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
            },
            delete_list: function (id_list) {
                $http.post('/api/notifications/delete', {
                    'list': id_list
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
            },
            notify: function (notification) {
                $http.post('/api/notifications/list', {
                    'project': notification.project._id.$oid,
                    'notification': notification
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
            }
        };
    }

    angular.module('mobyle.resources', ['ngResource'])
        .factory('mfResource', mfResource)
        .factory('DataTerm', DataTerm)
        .factory('FormatTerm', FormatTerm)
        .factory('ServiceTypeTerm', ServiceTypeTerm)
        .factory('Classification', Classification)
        .factory('Service', Service)
        .factory('Job', Job)
        .factory('ServiceTypeTermRegistry', ServiceTypeTermRegistry)
        .factory('MobyleConfig', MobyleConfig)
        .factory('User', User)
        .factory('Project', Project)
        .factory('ProjectData', ProjectData)
        .factory('Login', Login)
        .factory('Logout', Logout)
        .factory('PasswordResetRequest', PasswordResetRequest)
        .factory('PasswordReset', PasswordReset)
        .factory('Notification', Notification)
        .factory('NotificationsList', NotificationsList);
}());
