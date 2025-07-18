'use strict';

describe('Controller: GroupmanagerCtrl', function() {

    // load the controller's module
    beforeEach(module('kf6App'));

    var GroupmanagerCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        GroupmanagerCtrl = $controller('GroupmanagerCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function() {
        expect(1).toEqual(1);
    });
});