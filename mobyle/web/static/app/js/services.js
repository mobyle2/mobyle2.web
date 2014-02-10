'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('mobyle.services', ['ngResource']);

angular.module('mobyle.services').value('mbsimple', function(para) {
  // detect if a parameter or a paragraph is "simple"
  // it is simple if it has the "simple" property set to true
  // or if one of its children has the "simple" property set to true
  function simple(para){
    if(!para){
        return false;
    }
    if(!para.children){
      return para.simple==true;
    }else{
      return para.children.filter(simple).length>0;
    }
  }
  return simple(para);
});

angular.module('mobyle.services').factory('mfResource', function ($resource, $http) {
    function MFResourceFactory(collectionName, paramDefaults, actions) {
        // default url template, used for everything *but* search
        var route = '/' + collectionName.toLowerCase() + 's/:id';
        // url template used for search/filter
        var filterUrl = '/' + collectionName.toLowerCase() + "s?";
        for(var key in paramDefaults){
            filterUrl += "Search"+collectionName+"["+key+"]=:"+key+"&";
        }
        // custom function to build request body
        var transformRequestFactory = function(){
            return function(data){
                var requestObject = {};
                var serialize = function(prefix, data){
                    if (data instanceof Array){
                        $.each(data, function(index, value){
                            serialize(prefix+'['+index+']', data[index]);
                        });
                    }else if(data instanceof Object){
                        if(data.$oid){
                            requestObject[prefix]=data.$oid;
                        }else{
                            for (var prop in data){
                                if(data.hasOwnProperty(prop)){
                                    serialize(prefix+'['+prop+']', data[prop]);
                                }
                            }
                        }
                    }else{
                        if(data!=null){
                            requestObject[prefix]=data;
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
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            'method':'PUT',
            transformRequest: transformRequestFactory(''),
            transformResponse: transformResponse
        };
        var createAction = {
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            'method':'POST',
            transformRequest: transformRequestFactory(''),
            transformResponse: transformResponse,
            params: {}
        };
        var listAction = {
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            'method':'GET',
            transformRequest: transformRequestFactory(''),
            isArray: true
        };
        var filterAction = {
            url: filterUrl,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            'method': 'GET',
            transformRequest: transformRequestFactory('Search'),
            isArray: true
        };
        var resource = $resource(route, paramDefaults || {},
            $.extend({
             get: {
                  method:'GET',
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
        resource.prototype.$save = function() {
            if ( !this._id ) {
                return this.$create();
            }
            else {
                return this.$update();
            }
        };
        // define delete action that sends only the id of the object to be deleted
        resource.prototype.$delete = function(){
            return $http.delete('/' + collectionName.toLowerCase() + 's/' + this._id.$oid);
        }
        return resource;
    }
    return MFResourceFactory;
});

angular.module('mobyle.services').factory('Classification', function ($resource) {
    return $resource('/services/by_:key',{},{
        query: {isArray:false}
    });
});

angular.module('mobyle.services').factory('Service', function ($resource) {
    var resource = $resource('/services/:id',{},
        {
            get: {
                method: 'get',
                url: '/api/services/:id/:public_name/:version',
                transformResponse: function (data) {
                    var json_data = JSON.parse(data);
                    return json_data[json_data.object];
                }
            }
        }
    );
    return resource;
});

angular.module('mobyle.services').factory('DataTerm', function (mfResource) {
    return mfResource('DataTerm');
});

angular.module('mobyle.services').factory('FormatTerm', function (mfResource) {
    return mfResource('FormatTerm');
});

angular.module('mobyle.services').factory('User', function (mfResource) {
    return mfResource('User');
});

angular.module('mobyle.services').factory('Project', function (mfResource) {
    var defaultParams = {'name':'@name',
                         'public':'@public',
                         'owner':'@owner',
                         'users':'@users',
                         'id':'@_id.$oid'}

    return mfResource('Project',defaultParams);
});

angular.module('mobyle.services').factory('ProjectData', function (mfResource, $http) {

    var paramDefaults = {'name':'@name',
                         'description':'@description',
                         'project':'@project',
                         'tags':'@tags',
                         'id':'@_id.$oid',
                         'value':'@value',
                         'format_term': '@format_term',
                         'data_term':'@data_term'}
    var projectDataResource = mfResource('ProjectData',paramDefaults, {
        update: {
            'method':'PUT',
            'url':'/api/projectdata/:id'
        },
        list_by_project: {
            'method':'GET',
            'url':'/api/project/:project_id/data',
            isArray: true
        }
    });
    projectDataResource.prototype.$create = function(){
        return $http.post('/api/projectdata', this, {
            transformRequest: function(data, headersGetter){
                // use FormData to allow file uploads
                var fd = new FormData();
                angular.forEach(data, function(value, key) {
                    fd.append(key, value);
                })
                return fd;
            },
            headers: {'Content-Type': undefined}
        });
        //FIXME: current object is not updated with response from server
    }
    return projectDataResource;
});

angular.module('mobyle.services').factory('CurrentProject', function(Project, $rootScope){
    var currentProject = {};
    function setId(currentProjectId) {
        currentProject = Project.get({id:currentProjectId});
        $rootScope.$broadcast( 'CurrentProject.update', currentProject );
    }
    function get(){
        return currentProject;
    }
    return {
        setId: setId,
        get: get
    }
});

angular.module('mobyle.services').factory('CurrentUser', function(User, LoginManager, $rootScope, $log){
    var user = new User();
    var load = function(email){
        $log.info("load current user info for " + email);
        User.query({'email': email},
            function(users){
                user = users[0];
                $log.debug(users);
                $log.info("current user loaded: " + user.email);
            });
    }
    $rootScope.$on( 'LoginManager.update', function( event, login ) {
        load(login.email);
    });
    load(LoginManager.login.user);
    var get = function(){
        $log.info("returning current user :" + user.email);
        return user;
    }
    return {'get':get}
});

angular.module('mobyle.services').factory('Login', function ($resource) {
    function LoginFactory(authName) {
        return $resource('/auth/login/'+authName,{},
            {
            }
        );
    }
    return LoginFactory;
});

angular.module('mobyle.services').factory('Logout', function ($resource) {
    function LogoutFactory(authName) {
        return $resource('/auth/logout',{},
            {
            }
        );
    }
    return LogoutFactory;
});

angular.module('mobyle.services').factory('PasswordResetRequest', function ($resource) {
    function PasswordResetQuestFactory(authName) {
        return $resource('/auth/password/reset',{ username: authName},
            {
            }
        );
    }
    return PasswordResetQuestFactory;
});

angular.module('mobyle.services').factory('PasswordReset', function ($resource) {
    function PasswordResetQuestFactory(userToken, userNewPassword) {
        return $resource('/auth/password',{ token: userToken, password: userNewPassword},
            {
            }
        );
    }
    return PasswordResetQuestFactory;
});

/**
 *   Login controller is used at multiple places (global + login page).
 *   USe this service to store login process elements and notify controllers on update
  */
angular.module('mobyle.services').factory('LoginManager', function ($rootScope) {

    return { login : { 'user' : null, 'msg': '', 'status' : 0, 'admin' : false, 'default_project':null},
             result: function(user,msg,status,admin,default_project) {
                 this.login.user = user;
                 this.login.msg = msg;
                 this.login.status = status;
                 this.login.admin = admin;
                 this.login.defaultProjectId = default_project;
                 $rootScope.$broadcast( 'LoginManager.update', this.login );
             }
        };
});

