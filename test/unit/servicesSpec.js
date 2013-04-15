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

});
