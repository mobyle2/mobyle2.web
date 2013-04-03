'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
  beforeEach(module('awa.directives'));

  describe('toggle', function(){
    it('should display text-when-on if toggle-state==true', function(){
      inject(function($compile, $rootScope) {
        var element = $compile('<toggle text-when-on="when on" text-when-off="when off" toggle-state="1"></toggle>')($rootScope);
        $rootScope.$digest();
        expect(element[0].value).toEqual('when on');
      });
    });
    it('should display text-when-off if toggle-state==false', function(){
      inject(function($compile, $rootScope) {
          var element = $compile('<toggle text-when-on="when on" text-when-off="when off" toggle-state="0"></toggle>')($rootScope);
          $rootScope.$digest();
          expect(element[0].value).toEqual('when off');
      });
    });
    it('should display text-when-off if toggle-state is not defined', function(){
      inject(function($compile, $rootScope) {
          var element = $compile('<toggle text-when-on="when on" text-when-off="when off"></toggle>')($rootScope);
          $rootScope.$digest();
          expect(element[0].value).toEqual('when off');
      });
    });
  })
  
});
