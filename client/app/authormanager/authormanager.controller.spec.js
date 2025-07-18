'use strict';

describe('Controller: AuthormanagerCtrl', function () {

  // load the controller's module
  beforeEach(module('kf6App'));

  var AuthormanagerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AuthormanagerCtrl = $controller('AuthormanagerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
