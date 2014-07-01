/*global $:false, _:false */
(function () {
    'use strict';

    /* Directives */
    angular.module('mobyle.directives', []);

    angular.module('mobyle.directives').directive('activeLink', ['$location',
    function (location) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
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

    angular.module('mobyle.directives').directive('hiddable', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.css('position', 'relative');
                element.css('border-right', '1px solid #e5e5e5');
                var nextEl = element.next();
                var iEl = $('<i class="glyphicon glyphicon-chevron-left"></i>');
                var buttonEl = $('<button class="btn" style="width: 2em; position: absolute; top:0em; right: -2em; padding: 0;"></button>');
                element.append(buttonEl);
                buttonEl.append(iEl);
                var hiddableWidth;
                buttonEl.click(function () {
                    hiddableWidth = element.width();
                    element.children().css('overflow', 'hidden');
                    element.toggleClass('col-md-2 col-md-0');
                    nextEl.toggleClass('col-md-10 col-md-11');
                    iEl.toggleClass('glyphicon glyphicon-chevron-right glyphicon glyphicon-chevron-left');
                });
            }
        };
    });

    angular.module('mobyle.directives').directive('mboutput', [

    function () {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'views/mboutput.html',
                scope: {
                    para: '=',
                    job: '='
                },
                link: function (scope, element) {
                    // switch the type of the input according to the parameter type...
                    // work in progress...
                    switch (scope.para.type._type) {
                    case 'StringType':
                    case 'FloatType':
                    case 'IntegerType':
                    case 'BooleanType':
                        scope.displayType = 'text';
                        if (scope.para.type.options && scope.para.type.options.length > 0) {
                            angular.forEach(scope.para.type.options, function (option) {
                                if (option.value === scope.job.inputs[scope.para.name].value) {
                                    scope.text = option.label;
                                }
                            });
                        } else {
                            scope.text = scope.job.inputs[scope.para.name].value;
                        }
                        break;
                    case 'FormattedType':
                        //text formats
                        scope.displayType = 'file';
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
            };
    }]);


    angular.module('mobyle.directives').directive('mbinput', ['evalBoolFactory','$modal','ProjectData',
    function (evalBoolFactory, $modal, ProjectData) {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'views/mbinput.html',
                scope: {
                    para: '=',
                    job: '='
                },
                link: function (scope, element) {
                    // switch the type of the input according to the parameter type...
                    // work in progress...
                    switch (scope.para.type._type) {
                    case 'StringType':
                        if (scope.para.type.options && scope.para.type.options.length > 0) {
                            scope.select = true;
                            scope.options = [];
                            scope.para.type.options.forEach(function (item) {
                                scope.options.push({
                                    'label': item.label,
                                    'value': item.value
                                });
                            });
                        } else {
                            scope.itype = 'text';
                        }
                        break;
                    case 'FloatType':
                        scope.itype = 'number';
                        scope.step = 'any';
                        break;
                    case 'IntegerType':
                        scope.itype = 'number';
                        scope.step = '1';
                        break;
                    case 'BooleanType':
                        scope.select = true;
                        scope.options = [{
                            'label': 'yes',
                            'value': true
                        }, {
                            'label': 'no',
                            'value': false
                    }];
                        break;
                    case 'FormattedType':
                        //text formats
                        scope.textarea = true;
                        break;
                    default:
                        scope.untranslated = true;
                    }
                    if(scope.textarea){
                        scope.selectBookmark = function(){
                            var modalInstance = $modal.open({
                                templateUrl: 'views/dataSelect.html',
                                controller: 'DataSelectCtrl',
                                resolve: {
                                    para: function () {
                                        return scope.para;
                                    }
                                }
                            });
                            modalInstance.result.then(function (selectedItem) {
                                if (selectedItem) {
                                    // FIXME should not load data like this obviously,
                                    // but that's just to test controller communication.
                                    ProjectData.raw(selectedItem[0]._id).then(function (data) {
                                            scope.job.inputs[scope.para.name] = data.data;
                                        });
                                }
                            });
                        };
                    }
                    // initialize default value for the parameter in the model
                    if (!scope.job.inputs[scope.para.name]) {
                        scope.job.inputs[scope.para.name] = scope.para.type.
                        default;
                    }
                    // custom validation functions
                    scope.uiValidateString = '';
                    if (scope.para.ctrl) {
                        scope.uiValidateObj = {};
                        $.each(scope.para.ctrl, function (index, ctrlItem) {
                            scope['ctrls' + index] = {
                                'test': function ($value) {
                                    // manage 'value' key as the current parameter
                                    scope.job.inputs.value = $value;
                                    scope.job.inputs[scope.para.name] = $value;
                                    console.log(scope.para.name, $value, scope.para.type.
                                        default, evalBoolFactory(scope.job.inputs, scope.para.name)(ctrlItem.test));
                                    return evalBoolFactory(scope.job.inputs, scope.para.name)(ctrlItem.test);
                                },
                                'message': ctrlItem.message
                            };
                            scope.uiValidateObj['ctrls' + index] = 'ctrls' + index + '.test($value)';
                        });
                        scope.uiValidateString = JSON.stringify(scope.uiValidateObj);
                    }
                    var infoEl = element.find('[data-content]');
                    infoEl.bind('mouseover', function () {
                        infoEl.popover('show');
                    });
                    infoEl.bind('mouseout', function () {
                        infoEl.popover('hide');
                    });
                }
            };
    }]);

    angular.module('mobyle.directives').directive('ifPrecond', ['evalBoolFactory',
    function (evalBoolFactory) {
            return {
                restrict: 'A',
                link: function (scope, element) {
                    // compute if a precond applies for the display
                    // and to update the mandatory attribute of the para (if exists)
                    var precondApplies = evalBoolFactory(scope.job.inputs);
                    var mandatory = scope.para.mandatory;
                    var update = function (precond) {
                        var applies = precondApplies(precond);
                        if (applies) {
                            element.show();
                        } else {
                            element.hide();
                        }
                        scope.para.mandatory = (mandatory && applies);
                    };
                    scope.$watch('job.inputs', function () {
                        update(scope.para.precond);
                    }, true);
                }
            };
    }]);

    // recursive directive example
    // (from https://groups.google.com/forum/#!topic/angular/vswXTes_FtM)
    angular.module('mobyle.directives').directive('recursive', function ($compile) {
        return {
            restrict: 'E',
            priority: 100000,
            compile: function (tElement) {
                var contents = tElement.contents().remove();
                var compiledContents;
                return function (scope, iElement) {
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

    angular.module('mobyle.directives').directive('mbformpara', ['mbsimple',
    function (mbsimple) {
            return {
                scope: {
                    para: '=',
                    job: '=',
                    showAdvanced: '='
                },
                link: function (scope) {
                    scope.mbsimple = mbsimple;
                },
                templateUrl: 'views/mbformpara.html'
            };
    }]);


    angular.module('mobyle.directives').directive('mbjobpara', ['mbset',
    function (mbset) {
            return {
                scope: {
                    para: '=',
                    job: '=',
                },
                link: function (scope) {
                    scope.mbset = mbset;
                },
                templateUrl: 'views/mbjobpara.html'
            };
    }]);

    angular.module('mobyle.directives').directive('servicesClassification', [

    function () {
            return {
                restrict: 'E',
                replace: true,
                scope: {},
                templateUrl: 'views/classification.html',
                controller: function ($scope, Classification) {
                    var getServices = function(node){
                        return node.services.map(
                            function(service){
                                return service.name;
                            }).concat(node.sublevels.map(function(n){
                                return getServices(n);
                            }).reduce(function(n1,n2){
                                return n1.concat(n2);
                            },[]));
                    };
                    $scope.getServicesNumber = function(node){
                        return _.unique(getServices(node)).length;
                    };
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
                    };
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

    angular.module('mobyle.directives').directive('tree', [

        function () {
            return {
                templateUrl: 'views/tree.html',
                link: function (scope) {
                    scope.isService = function (tree) {
                        return tree.hasOwnProperty('version');
                    };
                    scope.toggleState = scope.defaultToggleState;
                    scope.toggle = function () {
                        scope.toggleState = !scope.toggleState;
                    };
                }
            };
    }]);

    angular.module('mobyle.directives').directive('typeText', ['ServiceTypeTermRegistry',
    function (ServiceTypeTermRegistry) {
            return {
                restrict: 'E',
                replace: true,
                template: '<span class="text-muted" style="font-size: x-small;">{{dataTermLabel}} <span ng-if="formatTermLabel">({{formatTermLabel}})</span></span>',
                scope: {
                    type: '='
                },
                link: function (scope) {
                    scope.dataTermLabel = '';
                    scope.formatTermLabel = '';
                    ServiceTypeTermRegistry.dataTermsById().then(function (dataTermsById) {
                        var dataIds = $.makeArray(scope.type.data_terms);
                        scope.dataTermLabel = $.map(dataIds, function (dataId) {
                            if (dataTermsById[dataId]) {
                                return dataTermsById[dataId].name;
                            } else {
                                return dataId;
                            }
                        }).join(', ');
                    });
                    ServiceTypeTermRegistry.formatTermsById().then(function (formatTermsById) {
                        var formatIds = $.makeArray(scope.type.format_terms);
                        scope.formatTermLabel = $.map(formatIds, function (formatId) {
                            if (formatTermsById[formatId]) {
                                return formatTermsById[formatId].name;
                            } else {
                                return formatId;
                            }
                        }).join(', ');
                    });
                }
            };
    }]);

    angular.module('mobyle.directives').directive('tinyTextFile', [

    function () {
            return {
                restrict: 'E',
                replace: true,
                require: 'ngModel',
                scope: {
                    'ngModel': '='
                },
                template: '<span class="btn-file btn">Load file...<input type="file" /></span>',
                link: function ($scope, element) {
                    var loadFile = function (evt) {
                        var result = '';
                        var files = evt.target.files; // FileList object
                        var chunkSize = 20000;
                        var readBlob = function (file, offset) {
                            var stop = offset + chunkSize - 1;
                            if (stop > (fileSize - 1)) {
                                stop = fileSize - 1;
                            }
                            var reader = new FileReader();
                            reader.onloadend = function(evt){
                                if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                                    result += evt.target.result;
                                    if (stop < fileSize - 1) {
                                        offset = offset + chunkSize;
                                        evt = null;
                                        readBlob(file, offset);
                                    } else {
                                        $scope.$apply(
                                            function () {
                                                $scope.ngModel.value = result;
                                                $scope.ngModel.name = file.name;
                                                $scope.ngModel.data.size = file.size;
                                            });
                                    }
                                }
                            };
                            var blob = file.slice(offset, stop + 1);
                            reader.readAsBinaryString(blob);
                        };
                        for (var i = 0, f; i === files.length; i++) {
                            f = files[i];
                            var fileSize = f.size;
                            readBlob(f, 0);
                        }
                    };
                    element.children().change(function (evt) {
                        loadFile(evt);
                    });
                }

            };
    }]);

    // utility directive to format correctly values for "number" inputs
    // which are not correctly handled by AngularJS
    // source: http://jsfiddle.net/SanderElias/qb44R/
    angular.module('mobyle.directives').directive('input', function () {
        return {
            restrict: 'E',
            require: '?ngModel',
            link: function (scope, elem, attrs, ctrl) {
                if (attrs.type.toLowerCase() !== 'number') {
                    return;
                } //only augment number input!
                ctrl.$formatters.push(function (value) {
                    return value ? parseFloat(value) : null;
                });
            }
        };
    });

}());