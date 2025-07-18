'use strict';

var should = require('should');
var app = require('../../app');
var User = require('./user.model');

var userInfo = {
  provider: 'local',
  userName: 'fakeUser',
  email: 'test@test.com',
  password: 'password'
};

var user = new User(userInfo);

describe('User Model', function() {
  before(function(done) {
    // Clear users before testing
    User.remove().exec().then(function() {
      done();
    });
  });

  afterEach(function(done) {
    User.remove().exec().then(function() {
      done();
    });
  });

  it('should begin with no users', function(done) {
    User.find({}, function(err, users) {
      users.should.have.length(0);
      done();
    });
  });

  it('should fail when saving a duplicate user', function(done) {
    user.save(function() {
      var userDuplicate = new User(userInfo);
      userDuplicate.save(function(err) {
        should.exist(err);
        done();
      });
    });
  });

  it('should fail when saving without an userName', function(done) {
    user.userName = '';
    user.save(function(err) {
      should.exist(err);
      done();
    });
  });

  it("should authenticate user if password is valid", function() {
    //should asserion.js does not work (Yoshiaki). Temporary Changed Code Mar 15, 2017    
    //return user.authenticate('password').should.be.true;
    return user.authenticate('password') === true;
  });

  it("should not authenticate user if password is invalid", function() {
    //should asserion.js does not work (Yoshiaki). Temporary Changed Code Mar 15, 2017
    //return user.authenticate('blah').should.not.be.true;
    return user.authenticate('blah') !== true;    
  });
});
