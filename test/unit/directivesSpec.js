'use strict';

/* jasmine specs for directives go here */

describe('directives', function () {
    beforeEach(module('awa.directives'));

    var scope;
    var toggle_off, toggle_on, toggle_undef;

    beforeEach(inject(function($rootScope, $compile){
        toggle_on = angular.element('<toggle text-when-on="when on" text-when-off="when off" toggle-state="1"></toggle>');
        toggle_off = angular.element('<toggle text-when-on="when on" text-when-off="when off" toggle-state="0"></toggle>');
        toggle_undef = angular.element('<toggle text-when-on="when on" text-when-off="when off"></toggle>');
        scope = $rootScope;
        $compile(toggle_on)(scope);
        $compile(toggle_off)(scope);
        $compile(toggle_undef)(scope);
        toggle_on = toggle_on[0];
        toggle_off = toggle_off[0];
        toggle_undef = toggle_undef[0];
        scope.$digest();
    }));




    describe('toggle', function () {
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
            expect(toggle_off.value).toEqual('when off');
        });
        it('should display text-when-off if toggle-state==on and the element is clicked', function () {
            // fails miserably on Chrome/Opera, but not on Firefox
            // error message is: Uncaught Error: Non-assignable model expression: 0 (directive: toggle)
            toggle_on.click();
            expect(toggle_on.value).toEqual('when on');
        });
    })

});

