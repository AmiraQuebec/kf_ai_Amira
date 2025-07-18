'use strict';

describe('Controller: CommunitytopCtrl', function () {

  // load the controller's module
  beforeEach(module('kf6App'));

  var CommunitytopCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CommunitytopCtrl = $controller('CommunitytopCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
