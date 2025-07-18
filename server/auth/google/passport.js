var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var googleSettings = require('../../../settings.js').google;
var clientSecret = googleSettings.clientSecret;
var clientId = googleSettings.clientId;

exports.setup = function (User, config) {
  passport.use(new GoogleStrategy({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'google.id': profile.id
      }, function(err, user) {
        if (!user) {
          var curr = new Date();
          user = new User({
            provider: 'google',
            firstName : profile.name.givenName,
            lastName : profile.name.familyName,
            email: profile.emails[0].value,
            userName: profile.id + '@google.com',
            role: 'user',
            accessToken : accessToken,
            expiryDate : new Date(curr.getTime()+3595*1000), 
            googleEmail : profile.emails[0].value,
            refreshToken : refreshToken,
            google: profile._json
          });
          //console.log(user);
          user.save(function(err) {
            if (err) done(err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));
};
