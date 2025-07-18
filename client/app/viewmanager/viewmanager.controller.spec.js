'use strict';

describe('Controller: ViewmanagerCtrl', function () {

  // load the controller's module
  beforeEach(module('kf6App'));

  var ViewmanagerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ViewmanagerCtrl = $controller('ViewmanagerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
