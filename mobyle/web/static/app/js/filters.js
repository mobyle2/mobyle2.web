'use strict';

function preg_quote( str ) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

    return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

function highlight( data, search )
{
    return data.replace( new RegExp( "(" + preg_quote( search ) + ")" , 'gi' ), "<b>$1</b>" );
}

/* Filters */
angular.module('mobyle.filters', []).
  filter('kwSearch', function() {
    // kwSearch searches for a query string (q)
    // in each service description of an array (s)
    // in the properties
    return function(s,q,f,case_insensitive){
      // cancel search if query string is shorter than 3 chars. long
      if(!q || q.length<3) return s;
      var out = []; // array of matching services
      for (var i = 0; i < s.length; i++){
        var o = angular.copy(s[i]);
        for (var j = 0; j < f.length; j++){
          if(o[f[j]] && ((!case_insensitive && o[f[j]].indexOf(q)!==-1) || (case_insensitive && o[f[j]].toUpperCase().indexOf(q.toUpperCase())!==-1)) ){
            // if matching. set found flag and highlight match(es)
            if(!case_insensitive){
                o[f[j]+'Hl']=o[f[j]].replace(q,'<strong>'+q+'</strong>','g');
            }else{
                o[f[j]+'Hl']=highlight(o[f[j]],q);
            }
            o['found']=true;
          }
        }
        if(o['found']) out.push(o);
      }
      return out;
    }
  });
