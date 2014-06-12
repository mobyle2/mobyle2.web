'use strict';

/* jasmine specs for directives go here */

describe('directives', function () {

    beforeEach(module('mobyle.directives'));

    describe('activeLink', function () {

        var scope, services_link, rootScope, location;

        beforeEach(inject(function ($rootScope, $compile, $location) {
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

        var scope, mbinput, html, compile, $httpBackend;

        // load the templates
        beforeEach(module('views/mbinput.html'));

        beforeEach(module('mobyle.services'));

        beforeEach(inject(function ($injector, $rootScope, $compile) {
            $httpBackend = $injector.get('$httpBackend');
            // resource listing
            var serviceTypeTermsResponse = [{
                "format_term_ids": ["EDAM_format:2200", "EDAM_format:1996"],
                "data_term_id": "EDAM_data:1384",
                "data_term_name": "Sequence alignment (protein)"
            }];
            $httpBackend.when('GET', '/servicetypeterms').respond(JSON.stringify(serviceTypeTermsResponse));
            scope = $rootScope.$new();
            scope.job = {'inputs':[]};
            mbinput = angular.element('<mbinput para="para" job="job">');
            compile = $compile;
        }));

        it('should have the label equal to parameter name if no prompt is specified', function ($compile) {
            $httpBackend.expectGET('/servicetypeterms');
            scope.para = {
                "name": "infile",
                "simple": true,
                "type": {}
            }
            html = compile(mbinput)(scope);
            scope.$digest();
            expect(html.find('label').text()).toContain(scope.para.name);
        });

        it('should have the label equal to parameter prompt if prompt is specified', function ($compile) {
            scope.para = {
                "name": "infile",
                "prompt": "input file",
                "simple": true,
                "type": {}
            }
            html = compile(mbinput)(scope);
            scope.$digest();
            expect(html.find('label').text()).toContain(scope.para.prompt);
        });


    });

    describe('mbformpara', function () {

        var scope, mbformpara, html, compile, $httpBackend;

        // load the templates
        beforeEach(module('views/mbinput.html'));
        beforeEach(module('views/mbformpara.html'));
        
        beforeEach(module('mobyle.services'));

        beforeEach(inject(function ($injector, $rootScope, $compile) {
            $httpBackend = $injector.get('$httpBackend');
            // resource listing
            var serviceTypeTermsResponse = [{
                "format_term_ids": ["EDAM_format:2200", "EDAM_format:1996"],
                "data_term_id": "EDAM_data:1384",
                "data_term_name": "Sequence alignment (protein)"
            }];
            $httpBackend.when('GET', '/servicetypeterms').respond(JSON.stringify(serviceTypeTermsResponse));
            scope = $rootScope.$new();
            compile = $compile;
            mbformpara = angular.element('<span recursive mbformpara job="job" para="para" show-advanced="showAdvanced"></span>');
            scope.para = {
                "prompt": "Paragraph prompt",
                "name": "paragraph name",
                "children": [
                    {
                        "prompt": "Parameter a prompt",
                        "name": "parameter a name",
                        "type": {
                            "_type": "StringType"
                        }
                    },
                    {
                        "prompt": "Parameter b prompt",
                        "name": "parameter b name",
                        "type": {
                            "_type": "StringType"
                        }
                    },
                    {
                        "prompt": "Parameter c prompt",
                        "name": "parameter c name",
                        "type": {
                            "_type": "StringType"
                        }
                    }
                ]
            }
            scope.job = {'inputs':[]};
            scope.showAdvanced = true;
            $httpBackend.expectGET('/servicetypeterms');
            html = compile(mbformpara)(scope);
            scope.$digest();
            html = html.children('div');
        }));

        it('should have the top id attribute equal to the paragraph name', function () {
            expect(html.attr('id')).toEqual(scope.para.name);
        });

        it('should have the heading text equal to the paragraph prompt', function () {
            expect(html.find('h4').find('a').text()).toEqual(scope.para.prompt);
        });

    });


});