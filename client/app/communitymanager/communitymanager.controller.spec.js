'use strict';

describe('Controller: CommunitymanagerCtrl', function () {

  // load the controller's module
  beforeEach(module('kf6App'));

  var CommunitymanagerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CommunitymanagerCtrl = $controller('CommunitymanagerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
