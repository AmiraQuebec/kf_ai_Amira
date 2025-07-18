'use strict';

describe('Controller: AuthorNetworkCtrl', function () {
  // load the controller's module
  beforeEach(module('kf6App'));

  var AuthorNetworkCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AuthorNetworkCtrl = $controller('AuthorNetworkCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
