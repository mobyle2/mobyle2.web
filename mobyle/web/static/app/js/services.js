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

angular.module('mobyle.services').factory('mfResource', function ($resource) {
    function MFResourceFactory(collectionName) {
        var resource = $resource('/'+collectionName+'/:id',{},
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

angular.module('mobyle.services').factory('Classification', function ($resource) {
    var resource = $resource('/services/by_:key',{},
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
});

// MbService is a factory to attach service methods to
// JSON data representing a data in Mobyle
// TODO: find a better name to
angular.module('mobyle.services').factory('MbService', function() {
    var MbService = function(data) {
        var flattenParameters = function(para_object){
            if(para_object.hasOwnProperty('children')){
                if(para_object.children.length>0){
                    return para_object.children.map(
                        function(child){
                            return flattenParameters(child);
                        }
                    ).reduce(
                          function(previous, current){
                            return previous.concat(current);
                          }
                        );
                }else{
                    return [];
                }
            }else{
                return [para_object];
            }
        }
        var getPrompts = function(parameters){
            return parameters.map(function(parameter){
                return parameter.prompt;
            })
        }
        //set defaults properties and functions
        angular.extend(this, {
            // get the flattened list of inputs
            getInputs:function(){
               return flattenParameters(this.inputs);
            },
            // get the flattened list of input prompts
            getInputPrompts:function(){
                return getPrompts(flattenParameters(this.inputs));
            },
            // get the flattened list of outputs
            getOutputs:function(){
                return flattenParameters(this.outputs);
            },
            // get the flattened list of outputs
            getOutputPrompts:function(){
                return getPrompts(flattenParameters(this.outputs));
            },
            // get the flattened list of all parameters
            getParameters:function(){
                return flattenParameters(this.inputs).concat(flattenParameters(this.outputs));
            },
            // get the flattened list of all parameter prompts
            getParameterPrompts:function(){
                return getPrompts(flattenParameters(this.inputs).concat(flattenParameters(this.outputs)));
            }
        });
        angular.extend(this, data);
    };
    return MbService;});

angular.module('mobyle.services').factory('Service', function (mfResource) {
    return mfResource('services');
});

angular.module('mobyle.services').factory('Type', function (mfResource) {
    return mfResource('types');
});

angular.module('mobyle.services').factory('Format', function (mfResource) {
    return mfResource('formats');
});

angular.module('mobyle.services').factory('Project', function (mfResource) {
    return mfResource('projects');
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

    return { login : { 'user' : null, 'msg': '', 'status' : 0, 'admin' : false},
             result: function(user,msg,status,admin) {
                 this.login.user = user;
                 this.login.msg = msg;
                 this.login.status = status;
                 this.login.admin = admin;
                 $rootScope.$broadcast( 'LoginManager.update', this.login );
             }
        };
});

