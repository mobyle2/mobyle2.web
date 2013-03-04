'use strict';

/* Filters */
angular.module('awa.filters', []).
  filter('searchServices', function() {
    var f = ['name','description','title'];
    return function(s,q){
      if(!q || q.length<3) return s;
      var out = [];
      for (var i = 0; i < s.length; i++){
        var o = angular.copy(s[i]);
        for (var j = 0; j < f.length; j++){
          if(o[f[j]].indexOf(q)!==-1){
            o[f[j]+'Hl']=o[f[j]].replace(q,'<strong>'+q+'</strong>','g');
            o['found']=true;
          }
        }
        if(o['found']) out.push(o);
      }
      return out;
    }
  });
