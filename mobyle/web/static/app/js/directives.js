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
        switch (scope.para.type.type){
            case "string":
                if(scope.para.type.options){
                    scope.select = true;
                    scope.options = [];
                    scope.para.type.options.forEach(function(item){
                        scope.options.push({"label":item.label,"value":item.value});
                    });
                }else{
                    scope.itype = "text";
                }
                break;
            case "float":
                scope.itype = "number";
                scope.step = "any";
                break;
            case "integer":
                scope.itype = "number";
                scope.step = "1";
                break;
            case "boolean":
                scope.select = true;
                scope.options = [{"label":"yes","value":true},{"label":"no","value":false}];
                break;
            case "formatted":
                //text formats
                scope.textarea = true;
                break;
            default:
                scope.untranslated = true;
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

angular.module('mobyle.directives').directive('flashMessages', function() {
    var directive = { restrict: 'E', replace: true };
    directive.template =
        '<div ng-repeat="m in messages" id="flash-messages">' +
            '<div class="alert {{ m.level }}">' +
            '<button class="close" data-dismiss="alert" type="button">×</button>' +
            '{{ m.text }}' +
            '</div>';
    '</div>';

    directive.controller = function($scope, $rootScope) {
        $rootScope.$on('flash:message', function(_, messages, done) {
            $scope.messages = messages;
            done();
        });
    };

    return directive;
});