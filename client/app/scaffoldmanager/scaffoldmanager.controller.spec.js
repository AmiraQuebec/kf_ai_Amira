'use strict';

describe('Controller: ScaffoldmanagerCtrl', function() {

    // load the controller's module
    beforeEach(module('kf6App'));

    var ScaffoldmanagerCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        ScaffoldmanagerCtrl = $controller('ScaffoldmanagerCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function() {
        expect(1).toEqual(1);
    });
});