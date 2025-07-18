'use strict';

describe('Controller: PromisingIdeasCtrl', function () {

    // load the controller's module
    beforeEach(module('kf6App'));

    var PromisingIdeasCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        PromisingIdeasCtrl = $controller('PromisingIdeasCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});