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

    beforeEach(module('mobyle.services'));


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
            $httpBackend.when('GET', '/tests').respond(JSON.stringify(testList));
            // resource detail
            testId = 1;
            testObject = {"object":"test","test":{"id":1,"foo":"bar"}};
            $httpBackend.when('GET', '/tests/1').respond(JSON.stringify(testObject));
            scope = $rootScope.$new();
            testMfResource = mfResource('Test');
        }));
        it('query() should return a list of objects', inject(function() {
           $httpBackend.expectGET('/tests');
           var res = testMfResource.query();
           $httpBackend.flush();
           expect(res).toEqualData(testList);
        }));
        it('get() should return an object detail', inject(function() {
            $httpBackend.expectGET('/tests/'+testId);
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
            $httpBackend.when('GET', '/services').respond(JSON.stringify(testServiceList));
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
            $httpBackend.expectGET('/services');
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
            $httpBackend.when('GET', '/projects?').respond(JSON.stringify(testProjectList));
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
            $httpBackend.when('GET', '/projects/aa?').respond(JSON.stringify(testProjectObject));
            scope = $rootScope.$new();
        }));
        it('query() should return a list of projects', inject(function(Project) {
            $httpBackend.expectGET('/projects?');
            var res = Project.query();
            $httpBackend.flush();
            expect(res).toEqualData(testProjectList);
        }));
        it('get() should return an project detail', inject(function(Project) {
            $httpBackend.expectGET('/projects/'+testId +'?');
            var res = Project.get({'id':testId});
            $httpBackend.flush();
            expect(res).toEqualData(testProjectObject["service"]);
        }));
        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });
    
    describe('evalBoolFactory', function() {
        var values = {
            'a':true,
            'b':false,
            'c':1,
            'd':0
            },
            evalFn;
        beforeEach(inject(function(evalBoolFactory) {
            evalFn = evalBoolFactory(values);
        }));
        it('should compute a==true = true', inject(function(mbsimple) {
            expect(evalFn({'a':true})).toEqual(true);
        }));
        it('should compute a==false = false', inject(function(mbsimple) {
            expect(evalFn({'a':false})).toEqual(false);
        }));
        it('should compute b==false = true', inject(function(mbsimple) {
            expect(evalFn({'b':false})).toEqual(true);
        }));
        it('should compute b==true = false', inject(function(mbsimple) {
            expect(evalFn({'b':true})).toEqual(false);
        }));
        it('should compute (a==true and b==false) = true', inject(function(mbsimple) {
            expect(evalFn({'#and':[{'a':true}, {'b':false}]})).toEqual(true);
        }));
        it('should compute (a==true and b==true) = false', inject(function(mbsimple) {
            expect(evalFn({'#and':[{'a':true}, {'b':true}]})).toEqual(false);
        }));
        it('should compute implicit and (a==true and b==true) = false', inject(function(mbsimple) {
            expect(evalFn({'a':true, 'b':true})).toEqual(false);
        }));
        it('should compute implicit and (a==false and b==false) = false', inject(function(mbsimple) {
            expect(evalFn({'a':false, 'b':false})).toEqual(false);
        }));
        it('should compute (a==true or b==true) = true', inject(function(mbsimple) {
            expect(evalFn({'#or':[{'a':true}, {'b':true}]})).toEqual(true);
        }));
        it('should compute !(a==false) = true', inject(function(mbsimple) {
            expect(evalFn({'#not':{'a':false}})).toEqual(true);
        }));
        it('should compute !(a==true) = false', inject(function(mbsimple) {
            expect(evalFn({'#not':{'a':true}})).toEqual(false);
        }));
        it('should compute (a==false nor b==true) = true', inject(function(mbsimple) {
            expect(evalFn({'#nor':[{'a':false}, {'b':true}]})).toEqual(true);
        }));
        it('should compute (a==true nor b==true) = false', inject(function(mbsimple) {
            expect(evalFn({'#nor':[{'a':true}, {'b':true}]})).toEqual(false);
        }));
        it('should compute (a==true nor b==false) = false', inject(function(mbsimple) {
            expect(evalFn({'#nor':[{'a':true}, {'b':false}]})).toEqual(false);
        }));
        it('should compute (c==1) = true', inject(function(mbsimple) {
            expect(evalFn({'c':1})).toEqual(true);
        }));
        it('should compute (c>=1) = true', inject(function(mbsimple) {
            expect(evalFn({'c':{'#gte':1}})).toEqual(true);
        }));
        it('should compute (c>1) = false', inject(function(mbsimple) {
            expect(evalFn({'c':{'#gt':1}})).toEqual(false);
        }));
        it('should compute (c<=1) = true', inject(function(mbsimple) {
            expect(evalFn({'c':{'#lte':1}})).toEqual(true);
        }));
        it('should compute (c<1) = false', inject(function(mbsimple) {
            expect(evalFn({'c':{'#lt':1}})).toEqual(false);
        }));
        it('should compute (c in [0, 1]) = true', inject(function(mbsimple) {
            expect(evalFn({'c':{'#in':[0, 1]}})).toEqual(true);
        }));
        it('should compute (c in [-1, 0]) = false', inject(function(mbsimple) {
            expect(evalFn({'c':{'#in':[-1, 0]}})).toEqual(false);
        }));
        it('should compute !(c in [0, 1]) = false', inject(function(mbsimple) {
            expect(evalFn({'c':{'#nin':[0, 1]}})).toEqual(false);
        }));
        it('should compute !(c in [-1, 0]) = true', inject(function(mbsimple) {
            expect(evalFn({'c':{'#nin':[-1, 0]}})).toEqual(true);
        }));
        it('should compute (c != 0) = true', inject(function(mbsimple) {
            expect(evalFn({'c':{'#ne':0}})).toEqual(true);
        }));
        it('should compute (c != 1) = false', inject(function(mbsimple) {
            expect(evalFn({'c':{'#ne':1}})).toEqual(false);
        }));
        it('should compute (c (!= 2 and > 0) = true', inject(function(mbsimple) {
            expect(evalFn({'c': {'#ne': 2, '#gt': 0}})).toEqual(true);
        }));
        it('should compute (c (!= 1 and > 0) = false', inject(function(mbsimple) {
            expect(evalFn({'c': {'#ne': 1, '#gt': 0}})).toEqual(false);
        }));
        it('should compute (c (!= 30 and > 2) = false', inject(function(mbsimple) {
            expect(evalFn({'c': {'#ne': 30, '#gt': 2}})).toEqual(false);
        }));
    });

});
