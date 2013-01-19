'use strict';

/* Directives */
angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

angular.module('myApp.directives').
  directive('activeLink', ['$location', function(location) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs, controller) {
            var clazz = attrs.activeLink;
            var path = attrs.href;
            path = path.substring(1); //hack because path does bot return including hashbang
            scope.location = location;
            scope.$watch('location.path()', function(newPath) {
                console.log(newPath+'=='+path);
                if (path === newPath) {
                    element.parent().addClass(clazz);
                } else {
                    element.parent().removeClass(clazz);
                }
            });
        }

    };
}]);

angular.module('myApp.directives')
  .directive('toggle', function(){
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
        // initialize the zippy
        updateText();
      }
    }
  });
