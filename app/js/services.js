'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('awa.services', ['ngResource']);

angular.module('awa.services').value('mbsimple', function(para) {
  // detect if a parameter or a paragraph is "simple"
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

        var resource = $resource('/api/'+collectionName+'/:id');
        return resource;
    }

    return MFResourceFactory;

});

angular.module('awa.services').factory('Service', function (mfResource) {
    return mfResource('services');
});
