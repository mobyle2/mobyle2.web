'use strict';

/* Filters */
angular.module('awa.filters', []).
  filter('searchServices', function() {
    // searchServices searches for a query string (q)
    // in each service description of an array (s)
    // in the properties f (see below)
    var f = ['name','description','title'];
    return function(s,q){
      // cancel search if query string is shorter than 3 chars. long
      if(!q || q.length<3) return s;
      var out = []; // array of matching services
      for (var i = 0; i < s.length; i++){
        var o = angular.copy(s[i]);
        for (var j = 0; j < f.length; j++){
          if(o[f[j]] && o[f[j]].indexOf(q)!==-1){
            // if matching. set found flag and highlight match(es)
            o[f[j]+'Hl']=o[f[j]].replace(q,'<strong>'+q+'</strong>','g');
            o['found']=true;
          }
        }
        if(o['found']) out.push(o);
      }
      return out;
    }
  });
