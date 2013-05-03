'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('awa.services', ['ngResource']);

angular.module('awa.services').value('mbsimple', function(para) {
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

angular.module('awa.services').factory('mfResource', function ($resource) {
    function MFResourceFactory(collectionName) {
        var resource = $resource('/api/'+collectionName+'/:id',{},
            {
             get: {
                  method:'get',
                  transformResponse: function (data) {
                                         var json_data = JSON.parse(data);
                                         return json_data[json_data.object];
                                     }

                 }
            }
        );
        return resource;
    }
    return MFResourceFactory;
});

angular.module('awa.services').factory('Service', function (mfResource) {
    return mfResource('services');
});

angular.module('awa.services').factory('Project', function (mfResource) {
    return mfResource('projects');
});


angular.module('awa.services').factory('Login', function ($resource) {
    function LoginFactory(authName) {
        return $resource('/api/auth/login/'+authName,{},
            {
            }
        );
    }
    return LoginFactory;
});

angular.module('awa.services').factory('Logout', function ($resource) {
    function LogoutFactory(authName) {
        return $resource('/api/auth/logout',{},
            {
            }
        );
    }
    return LogouFactory;
});

/**
 *   Login controller is used at multiple places (global + login page).
 *   USe this service to store login process elements and notify controllers on update
  */

angular.module('awa.services').factory('LoginManager', function ($rootScope) {

    return { login : { 'user' : null, 'msg': '', 'status' : 0},
             result: function(user,msg,status) {
                 this.login.user = user;
                 this.login.msg = msg;
                 this.login.status = status;
                 $rootScope.$broadcast( 'LoginManager.update', this.login );
             }
        };
});

