'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
  beforeEach(module('awa.directives'));

  describe('toggle', function(){
    it('should display textWhenOn if state==true', function(){
      inject(function($compile, $rootScope) {
        var element = $compile('<toggle textWhenOn="when on" textWhenOff="when off" state="true"></toggle>')($rootScope);
        $rootScope.$digest();
        expect(element[0].value).toEqual('when on');
      });
    });
    it('should display textWhenOff if state==false', function(){
      inject(function($compile, $rootScope) {
          var element = $compile('<toggle textWhenOn="when on" textWhenOff="when off" state="false"></toggle>')($rootScope);
          $rootScope.$digest();
          expect(element[0].value).toEqual('when off');
      });
    });
    it('should display textWhenOff if state is not defined', function(){
      inject(function($compile, $rootScope) {
          var element = $compile('<toggle textWhenOn="when on" textWhenOff="when off"></toggle>')($rootScope);
          $rootScope.$digest();
          expect(element[0].value).toEqual('when off');
      });
    });
  })

});
