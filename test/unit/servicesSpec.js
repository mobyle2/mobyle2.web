'use strict';

/* jasmine specs for services go here */

describe('service', function() {

    beforeEach(function(){
        this.addMatchers({
            toEqualData: function(expected) {
                return angular.equals(this.actual, expected);
            }
        });
    });

    beforeEach(module('awa.services'));


    describe('mbsimple', function() {
        it('should return true if the parameter has simple property set to true', inject(function(mbsimple) {
            expect(mbsimple({'simple':true})).toEqual(true);
        }));
        it('should return false if the parameter has simple property set to false', inject(function(mbsimple) {
            expect(mbsimple({'simple':false})).toEqual(false);
        }));
        it('should return false if nothing is provided', inject(function(mbsimple) {
            expect(mbsimple()).toEqual(false);
        }));''
        it('should return false if the parameter has simple property unspecified', inject(function(mbsimple) {
            expect(mbsimple({})).toEqual(false);
        }));
        it('should return false if the paragraph contains only non-simple children', inject(function(mbsimple) {
            expect(mbsimple({'children':[{'simple':false},{'simple':false}]})).toEqual(false);
        }));
        it('should return true if the paragraph contains at least one simple child', inject(function(mbsimple) {
            expect(mbsimple({'children':[{'simple':true},{'simple':false}]})).toEqual(true);
        }));
    });

    describe('mfResource', function() {
        var testMfResource, $httpBackend, scope, testList, testObject, testId;
        beforeEach(inject(function($injector, $rootScope, mfResource) {
            $httpBackend = $injector.get('$httpBackend');
            // resource listing
            testList = [{"id":1},{"id":2}];
            $httpBackend.when('GET', '/api/test').respond(JSON.stringify(testList));
            // resource detail
            testId = 1;
            testObject = {"object":"test","test":{"id":1,"foo":"bar"}};
            $httpBackend.when('GET', '/api/test/1').respond(JSON.stringify(testObject));
            scope = $rootScope.$new();
            testMfResource = mfResource('test');
        }));
        it('query() should return a list of objects', inject(function() {
           $httpBackend.expectGET('/api/test');
           var res = testMfResource.query();
           $httpBackend.flush();
           expect(res).toEqualData(testList);
        }));
        it('get() should return an object detail', inject(function() {
            $httpBackend.expectGET('/api/test/'+testId);
            var res = testMfResource.get({'id':testId});
            $httpBackend.flush();
            expect(res).toEqualData(testObject["test"]);
        }));
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
     });

    describe('Service', function() {
        var $httpBackend, scope, testServiceList, testServiceObject, testId;
        beforeEach(inject(function($injector, $rootScope, Service) {
            $httpBackend = $injector.get('$httpBackend');
            // resource listing
            testServiceList = [
                {
                    "_id": {
                        "$oid": "5152bedd93546d544bf4d7a8"
                    },
                    "description": "Tool 1",
                    "title": "tool1",
                    "package": null,
                    "version": null,
                    "type": "program",
                    "name": "tool1"
                },
                {
                    "_id": {
                        "$oid": "5152bedd93546d544bf4d99c"
                    },
                    "description": "Tool 2",
                    "title": "Tool 2",
                    "package": null,
                    "version": null,
                    "type": "program",
                    "name": "tool2"
                }
            ];
            $httpBackend.when('GET', '/api/services').respond(JSON.stringify(testServiceList));
            // resource detail
            testId = "5152bedd93546d544bf4d99c";
            testServiceObject = {"object":"service","service":                {
                "_id": {
                    "$oid": "5152bedd93546d544bf4d99c"
                },
                "description": "Tool 2",
                "title": "Tool 2",
                "package": null,
                "version": null,
                "type": "program",
                "name": "tool2"
            }};
            $httpBackend.when('GET', '/api/services/5152bedd93546d544bf4d99c').respond(JSON.stringify(testServiceObject));
            scope = $rootScope.$new();
        }));
        it('query() should return a list of services', inject(function(Service) {
            $httpBackend.expectGET('/api/services');
            var res = Service.query();
            $httpBackend.flush();
            expect(res).toEqualData(testServiceList);
        }));
        it('get() should return an service detail', inject(function(Service) {
            $httpBackend.expectGET('/api/services/'+testId);
            var res = Service.get({'id':testId});
            $httpBackend.flush();
            expect(res).toEqualData(testServiceObject["service"]);
        }));
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

    describe('Project', function() {
        var $httpBackend, scope, testProjectList, testProjectObject, testId;
        beforeEach(inject(function($injector, $rootScope, Service) {
            $httpBackend = $injector.get('$httpBackend');
            // resource listing
            testProjectList = [
                {
                    "_id": {
                        "$oid": "aa"
                    },
                    "name": "Project 1"
                },
                {
                    "_id": {
                        "$oid": "bb"
                    },
                    "description": "Project 2"
                }
            ];
            $httpBackend.when('GET', '/api/projects').respond(JSON.stringify(testProjectList));
            // resource detail
            testId = "aa";
            testProjectObject = {"object":"service", "service":
                {
                    "_id": {
                        "$oid": "aa"
                    },
                    "name": "Project 1"
                }
            };
            $httpBackend.when('GET', '/api/projects/aa').respond(JSON.stringify(testProjectObject));
            scope = $rootScope.$new();
        }));
        it('query() should return a list of projects', inject(function(Project) {
            $httpBackend.expectGET('/api/projects');
            var res = Project.query();
            $httpBackend.flush();
            expect(res).toEqualData(testProjectList);
        }));
        it('get() should return an project detail', inject(function(Project) {
            $httpBackend.expectGET('/api/projects/'+testId);
            var res = Project.get({'id':testId});
            $httpBackend.flush();
            expect(res).toEqualData(testProjectObject["service"]);
        }));
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });

});
