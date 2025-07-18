'use strict';

describe('Controller: WcloudCtrl', function () {

  // load the controller's module
  beforeEach(module('kf6App'));

  var WcloudCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    WcloudCtrl = $controller('WcloudCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
