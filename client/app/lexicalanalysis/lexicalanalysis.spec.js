'use strict';

describe('Controller: LexicalAnalysisCtrl', function () {

    // load the controller's module
    beforeEach(module('kf6App'));

    var LexicalAnalysisCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        LexicalAnalysisCtrl = $controller('LexicalAnalysisCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});