'use strict';

describe('Controller: HistoricalobjectCtrl', function() {

    // load the controller's module
    beforeEach(module('kf6App'));

    var HistoricalobjectCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        HistoricalobjectCtrl = $controller('HistoricalobjectCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function() {
        expect(1).toEqual(1);
    });
});