'use strict';

/* Directives */
angular.module('mobyle.directives', []);

angular.module('mobyle.directives').directive('activeLink', ['$location',
    function (location) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs, controller) {
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
        restrict: 'E',
        replace: true,
        scope: {
            toggleState: '=',
            textWhenOn: '@',
            textWhenOff: '@'
        },
        template: '<input type="button" value="{{text}}" ng-click="toggle()"/>',
        controller: function ($scope) {
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

angular.module('mobyle.directives').directive('hiddable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.css('position', 'relative');
            element.css('border-right', '1px solid #e5e5e5');
            var nextEl = element.next();
            var iEl = $('<i class="icon-chevron-left"></i>');
            var buttonEl = $('<button class="btn" style="width: 2em; position: absolute; top:0em; right: -2em; padding: 0;"></button>');
            element.append(buttonEl);
            buttonEl.append(iEl);
            var hiddableWidth;
            buttonEl.click(function () {
                hiddableWidth = element.width();
                element.children().css('overflow', 'hidden');
                element.toggleClass('span2 span0');
                nextEl.toggleClass('span10 span11');
                iEl.toggleClass('icon-chevron-right icon-chevron-left');
            });
        }
    }
});

angular.module('mobyle.directives').directive('mbinput', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        templateUrl: 'views/mbinput.html',
        //template: '<input ng-show="itype" type="{{itype}}" name="{{para.name}}" value="" placeholder="{{para}}"/>',
        scope: {
            para: '='
        },
        link: function (scope, element, attrs) {
            // switch the type of the input according to the parameter type...
            // work in progress...
            switch (scope.para.type._type) {
            case "StringType":
                if (scope.para.type.options && scope.para.type.options.length > 0) {
                    scope.select = true;
                    scope.options = [];
                    scope.para.type.options.forEach(function (item) {
                        scope.options.push({
                            "label": item.label,
                            "value": item.value
                        });
                    });
                } else {
                    scope.itype = "text";
                }
                break;
            case "FloatType":
                scope.itype = "number";
                scope.step = "any";
                break;
            case "IntegerType":
                scope.itype = "number";
                scope.step = "1";
                break;
            case "BooleanType":
                scope.select = true;
                scope.options = [{
                    "label": "yes",
                    "value": true
                }, {
                    "label": "no",
                    "value": false
                }];
                break;
            case "FormattedType":
                //text formats
                scope.textarea = true;
                break;
            default:
                scope.untranslated = true;
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
        restrict: "E",
        priority: 100000,
        compile: function (tElement, tAttr) {
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

angular.module('mobyle.directives').directive("mbformpara", [
    function () {
        return {
            templateUrl: 'views/mbformpara.html'
        };
}]);

angular.module('mobyle.directives').directive("servicesClassification", [
    function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'views/classification.html',
            controller: function ($scope, Classification) {
                $scope.load = function (query) {
                    $scope.loading = true;
                    $scope.tree = null;
                    $scope.defaultToggleState = !query;
                    Classification.query({
                        key: 'topic',
                        filter: query
                    }, function (classification) {
                        $scope.tree = classification;
                        $scope.loading = false;
                    });
                }
                $scope.load();
                $scope.$watch('query', function (newValue, oldValue) {
                    if ((!oldValue || oldValue.length < 3) && (!newValue || newValue.length < 3)) {
                        return;
                    } else if (!newValue || newValue.length < 3) {
                        $scope.load(null);
                    } else {
                        $scope.load(newValue);
                    }
                });
            }
        };
}]);

angular.module('mobyle.directives').directive("tree", [
    function () {
        return {
            templateUrl: 'views/tree.html',
            link: function (scope, element, attrs) {
                scope.isService = function (tree) {
                    return tree.hasOwnProperty('version');
                }
                scope.toggleState = scope.defaultToggleState;
                scope.toggle = function () {
                    scope.toggleState = !scope.toggleState;
                }
            }
        };
}]);

angular.module('mobyle.directives').directive('typeText', ['ServiceTypeTermRegistry',
    function (ServiceTypeTermRegistry) {
        return {
        restrict: 'E',
        replace: true,
        template: '<span>{{dataTermLabel}} <span ng-if="formatTermLabel">({{formatTermLabel}})</span></span>',
        scope: {
            type: '='
        },
        link: function (scope, element, attrs) {
            scope.dataTermLabel = "";
            scope.formatTermLabel = "";
            ServiceTypeTermRegistry.dataTermsById().then(function(dataTermsById){
                scope.dataTermLabel = dataTermsById[scope.type.data_terms]["data_term_name"];
            });
            ServiceTypeTermRegistry.formatTermsById().then(function(formatTermsById){
                scope.formatTermLabel = formatTermsById[scope.type.format_terms]["name"];                
            });
        }};
}]);

angular.module('mobyle.directives').directive("tinyTextFile", [
    function () {
        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            scope: {
                'ngModel': '='
            },
            template: '<span><input type="file" /></span>',
            link: function ($scope, element) {
                var loadFile = function (evt) {
                    var result = "";
                    var files = evt.target.files; // FileList object
                    var chunkSize = 20000;
                    for (var i = 0, f; f = files[i]; i++) {
                        var fileSize = f.size;
                        var readBlob = function (file, offset) {
                            var stop = offset + chunkSize - 1;
                            if (stop > (fileSize - 1)) {
                                stop = fileSize - 1
                            };
                            var reader = new FileReader();
                            reader.onloadend = function (evt) {
                                if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                                    result += evt.target.result;
                                    if (stop < fileSize - 1) {
                                        offset = offset + chunkSize;
                                        evt = null;
                                        readBlob(file, offset);
                                    } else {
                                        $scope.$apply(
                                            function () {
                                                $scope.ngModel['value'] = result;
                                                $scope.ngModel['name'] = file.name;
                                            });
                                    }
                                }
                            };
                            var blob = file.slice(offset, stop + 1);
                            reader.readAsBinaryString(blob);
                        }
                        readBlob(f, 0);
                    }
                }
                element.children().change(function (evt) {
                    console.log(evt.target);
                    loadFile(evt);
                })
            }

        };
}]);