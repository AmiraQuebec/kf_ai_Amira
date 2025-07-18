'use strict';

describe('Controller: ContributionCtrl', function () {

  // load the controller's module
  beforeEach(module('kf6App'));

  var ContributionCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ContributionCtrl = $controller('ContributionCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
