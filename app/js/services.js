'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('awa.services', []).
  value('version', '0.1');

angular.module('awa.services').value('mbsimple', function(para) {
  // detect if a parameter or a paragraph is "simple"
  function simple(para){
    if(!para.children){
      return para.simple==true;
    }else{
      return para.children.filter(simple).length>0;
    }
  }
  return simple(para);
});
