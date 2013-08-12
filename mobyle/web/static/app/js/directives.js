'use strict';

/* Directives */
angular.module('mobyle.directives', []);

angular.module('mobyle.directives').directive('activeLink', ['$location', function(location) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs, controller) {
      var clazz = attrs.activeLink;
      var path = attrs.href;
      path = path.substring(1); //hack because return path includes leading hash
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

angular.module('mobyle.directives').directive('toggle', function(){
  return {
    restrict: 'E',
    replace: true,
    scope: {
        toggleState:'=',
        textWhenOn:'@',
        textWhenOff:'@'
    },
    template: '<input type="button" value="{{text}}" ng-click="toggle()"/>',
    controller: function($scope){
      $scope.toggle = function(){
        $scope.toggleState = !$scope.toggleState;
        $scope.updateText();
      }
      $scope.updateText = function(){
        $scope.text = $scope.toggleState ? $scope.textWhenOn : $scope.textWhenOff;
      }
      $scope.updateText();
    }
  }
});

angular.module('mobyle.directives').directive('mbinput', function(){
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
angular.module('mobyle.directives').directive("recursive", function($compile) {
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

angular.module('mobyle.directives').directive("mbformpara", [function() {
  return {
    templateUrl: 'partials/mbformpara.html'
  };
}]);

angular.module('mobyle.directives').directive("tree", [function() {
    return {
        templateUrl: 'partials/tree.html',
        link: function(scope, element, attrs) {
            scope.isService = function(tree){
                return tree.hasOwnProperty('version');
            }
            scope.toggleState = scope.defaultToggleState;
            scope.toggle = function(){
                scope.toggleState = !scope.toggleState;
            }
        }
    };
}]);