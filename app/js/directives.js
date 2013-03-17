'use strict';

/* Directives */
angular.module('awa.directives', []).directive('appVersion', ['version', function(version) {
  return function(scope, elm, attrs) {
    elm.text(version);
  };
}]);

angular.module('awa.directives').directive('activeLink', ['$location', function(location) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs, controller) {
      var clazz = attrs.activeLink;
      var path = attrs.href;
      path = path.substring(1); //hack because path does bot return including hashbang
      scope.location = location;
      scope.$watch('location.path()', function(newPath) {
        if (path === newPath) {
          element.parent().addClass(clazz);
        } else {
          element.parent().removeClass(clazz);
        }
      });
    }
  };
}]);

angular.module('awa.directives').directive('toggle', function(){
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<input type="button" value="{{text}}" />',
    // The linking function will add behavior to the template
    link: function(scope, element, attrs) {
      // on/off state
      scope.on = (attrs.state=='true');
      scope.trigger = attrs.ngModel;
      // Clicking on title should open/close the zippy
      element.bind('click', toggle);
      // Toggle the closed/opened state
      function updateText(){
        scope.text = scope.on ? attrs.textwhenon : attrs.textwhenoff;
      }
      function toggle() {
        scope.on = !scope.on;
        updateText();
      }
      // initialize
      updateText();
    }
  }
});

angular.module('awa.directives').directive('mbinput', function(){
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    templateUrl: 'partials/mbinput.html',
    //template: '<input ng-show="itype" type="{{itype}}" name="{{para.name}}" value="" placeholder="{{para}}"/>',
    scope: { para: '=' },
    link: function(scope, element, attrs) {
      // switch the type of the input according to the parameter type...
      // work in progress...
      try{
        scope.textinput = scope.para.type_p.edam_formats.indexOf("0002200")!=-1;
      }catch(e){
        scope.itype = "text";
      }
      var infoEl = element.find('[data-content]');
      infoEl.bind('mouseover', function(){infoEl.popover('show');});
      infoEl.bind('mouseout', function(){infoEl.popover('hide');});
    }
  }
});

// recursive directive example
// (from https://groups.google.com/forum/#!topic/angular/vswXTes_FtM)
angular.module('awa.directives').directive("recursive", function($compile) {
  return {
    restrict: "E",
    priority: 100000,
    compile: function(tElement, tAttr) {
      var contents = tElement.contents().remove();
      var compiledContents;
      return function(scope, iElement, iAttr) {
        if(!compiledContents) {
          compiledContents = $compile(contents);
        }
        iElement.append(
          compiledContents(scope, 
                           function(clone) {
                               return clone; }));
      };
    }
  };
});

angular.module('awa.directives').directive("mbformpara", ['mbsimple', function() {
  return {
    scope: {mbformpara: '='},
    templateUrl: 'partials/mbformpara.html',
    compile: function() {
      return  function($scope){
        //$scope.simple = mbsimple($scope.mbformpara);
        //$scope.show_advanced = !mbsimple($scope.mbformpara);
      }
    }
  };
}]);