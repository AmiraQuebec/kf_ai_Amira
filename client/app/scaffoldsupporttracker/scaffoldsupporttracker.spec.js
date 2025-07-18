'use strict';

describe('Controller: ScaffoldsupporttrackerCtrl', function () {

    // load the controller's module
    beforeEach(module('kf6App'));

    var ScaffoldsupporttrackerCtrl, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        ScaffoldsupporttrackerCtrl = $controller('ScaffoldsupporttrackerCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});