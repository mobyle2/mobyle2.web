'use strict';

/* Directives */
angular.module('mobyle.directives', []);

angular.module('mobyle.directives').directive('activeLink', ['$location', function (location) {
    return {
        restrict:'A',
        link:function (scope, element, attrs, controller) {
            var clazz = attrs.activeLink;
            var path = attrs.href;
            path = path.substring(1); //hack because return path includes leading hash
            scope.location = location;
            scope.$watch('location.path()', function (newPath) {
                if (path === newPath) {
                    element.parent().addClass(clazz);
                } else {
                    element.parent().removeClass(clazz);
                }
            });
        }
    };
}]);

angular.module('mobyle.directives').directive('toggle', function () {
    return {
        restrict:'E',
        replace:true,
        scope:{
            toggleState:'=',
            textWhenOn:'@',
            textWhenOff:'@'
        },
        template:'<input type="button" value="{{text}}" ng-click="toggle()"/>',
        controller:function ($scope) {
            $scope.toggle = function () {
                $scope.toggleState = !$scope.toggleState;
                $scope.updateText();
            }
            $scope.updateText = function () {
                $scope.text = $scope.toggleState ? $scope.textWhenOn : $scope.textWhenOff;
            }
            $scope.updateText();
        }
    }
});

angular.module('mobyle.directives').directive('mbinput', function () {
    return {
        restrict:'E',
        replace:true,
        transclude:true,
        templateUrl:'partials/mbinput.html',
        //template: '<input ng-show="itype" type="{{itype}}" name="{{para.name}}" value="" placeholder="{{para}}"/>',
        scope:{ para:'=' },
        link:function (scope, element, attrs) {
            // switch the type of the input according to the parameter type...
            // work in progress...
            try {
                scope.textinput = scope.para.type_p.edam_formats.indexOf("0002200") != -1;
            } catch (e) {
                scope.itype = "text";
            }
            var infoEl = element.find('[data-content]');
            infoEl.bind('mouseover', function () {
                infoEl.popover('show');
            });
            infoEl.bind('mouseout', function () {
                infoEl.popover('hide');
            });
        }
    }
});

// recursive directive example
// (from https://groups.google.com/forum/#!topic/angular/vswXTes_FtM)
angular.module('mobyle.directives').directive("recursive", function ($compile) {
    return {
        restrict:"E",
        priority:100000,
        compile:function (tElement, tAttr) {
            var contents = tElement.contents().remove();
            var compiledContents;
            return function (scope, iElement, iAttr) {
                if (!compiledContents) {
                    compiledContents = $compile(contents);
                }
                iElement.append(
                    compiledContents(scope,
                        function (clone) {
                            return clone;
                        }));
            };
        }
    };
});

angular.module('mobyle.directives').directive("mbformpara", [function () {
    return {
        templateUrl:'partials/mbformpara.html'
    };
}]);

angular.module('mobyle.directives').
    directive('draggable', function ($document) {
        return function (scope, element, attr) {
            var startX = 0, startY = 0, x = 0, y = 0;
            element.css({
                cursor:'move'
            });
            element.bind('mousedown', function (event) {
                // Prevent default dragging of selected content
                event.preventDefault();
                x = element.attr('x');
                y = element.attr('y');
                startX = event.screenX - x;
                startY = event.screenY - y;
                $document.bind('mousemove', mousemove);
                $document.bind('mouseup', mouseup);
            });
            function mousemove(event) {
                y = event.screenY - startY;
                x = event.screenX - startX;
                x = x < 0 ? 0 : x;
                y = y < 0 ? 0 : y;
                element.attr('x', x);
                element.attr('y', y);
            }
            function mouseup() {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
            }
        }
    });
// workaround for issue #1050 in angular-chrome
// might be removed if issue solved in a newest version of angular
// https://github.com/angular/angular.js/issues/1050#issuecomment-9643773
angular.module('mobyle.directives').directive('ngX',function () {
        return function (scope, elem, attrs) {
            attrs.$observe('ngX', function (x) {
                elem.attr('x', x);
            });
        };
    }).directive('ngY',function () {
        return function (scope, elem, attrs) {
            attrs.$observe('ngY', function (y) {
                elem.attr('y', y);
            });
        };
    }).directive('ngWidth',function () {
        return function (scope, elem, attrs) {
            attrs.$observe('ngWidth', function (width) {
                elem.attr('width', width);
            });
        };
    }).directive('ngHeight', function () {
        return function (scope, elem, attrs) {
            attrs.$observe('ngHeight', function (height) {
                elem.attr('height', height);
            });
        };
    });

angular.module('mobyle.directives').
    directive('task', function ($document) {
        return {
            restrict:'E',
            replace:true,
            transclude:true,
            template:'<svg ng-x="{{taskx}}" ng-y="{{tasky}}"><rect class="box" ng-x="2" ng-y="2" ng-width="{{width}}em" ng-height="{{height}}" rx="10" ry="10" fill="#D8FFCF" stroke="grey" stroke-width="3"></rect><text ng-x="{{width/2}}em" ng-y="15" style="text-anchor: middle"> {{taskText}} </text><tinput /></svg>',
            scope:{ taskx:'@',
                tasky:'@',
                serviceName:'@',
                taskName:'@'
            },
            link:function (scope, element, attrs) {
                scope.height = 50;
                scope.taskText = scope.taskName ? scope.taskName : scope.serviceName;
                scope.width = scope.taskText.length;
            }

        }
    });

angular.module('mobyle.directives').
    directive('tinput', function ($document) {
        return {
            restrict:'E',
            replace:true,
            transclude:true,
            template:'<svg x="4" y="4" z-index="999" ><circle z-index="999" cx="4" cy="4" r="8" fill="yellow" stroke="grey" stroke-width="3"/></svg>',
            link:function (scope, element, attrs) {
            }

        }
    });