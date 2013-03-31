'use strict';

/* jasmine specs for filters go here */

describe('filter', function() {
  beforeEach(module('awa.filters'));


  describe('searchServices', function() {
    it('should not filter if no query provided', inject(function(searchServicesFilter) {
      var services = [{'name':'test1'},{'name':'test2'}];
      var q = '';
      expect(searchServicesFilter(services,q)).toEqual(services);
    }));
    it('should filter only the matching service', inject(function(searchServicesFilter) {
        var matchingService = {'name':'test1', 'description': 'matching description'};
        var matchedServices = [{'name':'test1',
                                'description': 'matching description',
                                'descriptionHl': '<strong>matching</strong> description',
                                'found': true}];
        var nonMatchingService = {'name':'test1', 'description': 'nothing to match'};
        var services = [matchingService,nonMatchingService];
        var q = 'matching';
        expect(searchServicesFilter(services,q)).toEqual(matchedServices);
    }));
  });
});
