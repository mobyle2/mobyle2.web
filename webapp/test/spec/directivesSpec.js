'use strict';

/* jasmine specs for directives go here */

describe('directives', function () {

    beforeEach(module('mobyle.directives'));

    describe('toggle', function () {

        var scope;
        var toggle_off, toggle_on, toggle_undef;

        beforeEach(inject(function($rootScope, $compile){
            toggle_on = angular.element('<toggle text-when-on="when on" text-when-off="when off" toggle-state="on"></toggle>');
            toggle_off = angular.element('<toggle text-when-on="when on" text-when-off="when off" toggle-state="off"></toggle>');
            toggle_undef = angular.element('<toggle text-when-on="when on" text-when-off="when off"></toggle>');
            scope = $rootScope;
            scope.on = true;
            scope.off = false;
            $compile(toggle_on)(scope);
            $compile(toggle_off)(scope);
            $compile(toggle_undef)(scope);
            toggle_on = toggle_on[0];
            toggle_off = toggle_off[0];
            toggle_undef = toggle_undef[0];
            scope.$digest();
        }));

        it('should display text-when-on if toggle-state==true', function () {
            expect(toggle_on.value).toEqual('when on');
        });

        it('should display text-when-off if toggle-state==false', function () {
            expect(toggle_off.value).toEqual('when off');
        });

        it('should display text-when-off if toggle-state is not defined', function () {
            expect(toggle_undef.value).toEqual('when off');
        });

        it('should display text-when-on if toggle-state==off and the element is clicked', function () {
            toggle_off.click();

            expect(toggle_off.value).toEqual('when on');
        });

        it('should display text-when-off if toggle-state==on and the element is clicked', function () {
            // fails miserably on Chrome/Opera, but not on Firefox
            // error message is: Uncaught Error: Non-assignable model expression: 0 (directive: toggle)
            toggle_on.click();
            expect(toggle_on.value).toEqual('when off');
        });

    });

    describe('activeLink', function () {

        var scope, services_link, rootScope, location;

        beforeEach(inject(function($rootScope, $compile, $location){
            location = $location;
            rootScope = $rootScope;
            scope = $rootScope.$new();
            services_link = angular.element('<li><a href="#/services" active-link="active">services</a></li>');
            $compile(services_link)(scope);
            services_link = services_link[0];
            scope.$digest();
        }));

        it('should not have the css class for the active state by default', function () {
            expect(angular.element(services_link).hasClass('active')).toBeFalsy();
        });

        it('should have the css class for the active state if the current location matches', function () {
            location.path('/services');
            scope.$apply();
            scope.$digest();
            expect(angular.element(services_link).hasClass('active')).toBeTruthy();
        });

        it('should not have the css class for the active state if the current location does not match', function () {
            location.path('/anything');
            scope.$apply();
            scope.$digest();
            expect(angular.element(services_link).hasClass('active')).toBeFalsy();
        });

    });


    describe('mbinput', function () {

        var scope, mbinput, html, compile;

        // load the templates
        beforeEach(module('views/mbinput.html'));

        beforeEach(inject(function($rootScope, $compile){
            scope = $rootScope.$new();
            mbinput = angular.element('<mbinput para="mbformpara">');
            compile = $compile;
        }));

        it('should have the label equal to parameter name if no prompt is specified', function ($compile) {
            scope.mbformpara = {
                "name": "infile",
                "simple": true,
                "type": {
                }
            }
            html = compile(mbinput)(scope);
            scope.$digest();
            expect(html.find('label').text()).toContain(scope.mbformpara.name);
        });

        it('should have the label equal to parameter prompt if prompt is specified', function ($compile) {
            scope.mbformpara = {
                "name": "infile",
                "prompt": "input file",
                "simple": true,
                "type": {
                }
            }
            html = compile(mbinput)(scope);
            scope.$digest();
            expect(html.find('label').text()).toContain(scope.mbformpara.prompt);
        });


    });

    describe('mbformpara', function () {

        var scope, mbformpara, html, compile;

        // load the templates
        beforeEach(module('views/mbinput.html'));
        beforeEach(module('views/mbformpara.html'));

        beforeEach(inject(function($rootScope, $compile){
            scope = $rootScope.$new();
            compile = $compile;
            mbformpara = angular.element('<span recursive mbformpara="mbformpara">');
            scope.mbformpara = {
                "prompt": "Paragraph prompt",
                "name": "paragraph name",
                "children": [
                    {
                        "prompt": "Parameter a prompt",
                        "name": "parameter a name",
                        "type": {"_type": "StringType"}
                    },
                    {
                        "prompt": "Parameter b prompt",
                        "name": "parameter b name",
                        "type": {"_type": "StringType"}
                    },
                    {
                        "prompt": "Parameter c prompt",
                        "name": "parameter c name",
                        "type": {"_type": "StringType"}
                    }
                ]
            }
            html = compile(mbformpara)(scope);
            scope.$digest();
            html = html.children('div');
        }));

        it('should have the top id attribute equal to the paragraph name', function () {
            expect(html.attr('id')).toEqual(scope.mbformpara.name);
        });

        it('should have the heading text equal to the paragraph prompt', function () {
            expect(html.find('h4').find('a').text()).toEqual(scope.mbformpara.prompt);
        });

    });


});
