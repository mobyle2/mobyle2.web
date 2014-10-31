'use strict';

/* jasmine specs for filters go here */

describe('filter', function() {
  beforeEach(module('mobyle'));


  describe('kwSearch', function() {
    it('should not filter if no query provided', inject(function(kwSearchFilter) {
      var services = [{'name':'test1'},{'name':'test2'}];
      var q = '';
      expect(kwSearchFilter(services,q)).toEqual(services);
    }));
    it('should filter only the matching service', inject(function(kwSearchFilter) {
        var matchingService = {'name':'test1', 'description': 'matching description'};
        var matchedServices = [{'name':'test1',
                                'description': 'matching description',
                                'descriptionHl': '<strong>matching</strong> description',
                                'found': true}];
        var nonMatchingService = {'name':'test1', 'description': 'nothing to match'};
        var services = [matchingService,nonMatchingService];
        var q = 'matching';
        expect(kwSearchFilter(services,q,['name','description'])).toEqual(matchedServices);
    }));
  });
});
