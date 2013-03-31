'use strict';

/* jasmine specs for services go here */

describe('service', function() {
    beforeEach(module('awa.services'));


    describe('mbsimple', function() {
        it('should return true if the parameter has simple property set to true', inject(function(mbsimple) {
            expect(mbsimple({'simple':true})).toEqual(true);
        }));
        it('should return false if the parameter has simple property set to false', inject(function(mbsimple) {
            expect(mbsimple({'simple':false})).toEqual(false);
        }));
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
});
