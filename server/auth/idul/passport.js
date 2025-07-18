var passport = require('passport');
var LdapStrategy = require('passport-ldapauth').Strategy;

var getLDAPConfiguration = function(req, callback) {
  process.nextTick(function() {
    var opts = {
      usernameField: 'username',
      passwordField: 'password',
      server: {
        url: 'ldaps://ldap.ulaval.ca:636',
        bindDn: 'cn=' + req.body.username + ',OU=IDUL,OU=Comptes,DC=ulaval,DC=ca',
        bindCredentials: req.body.password,
        searchBase: 'OU=IDUL,OU=Comptes,DC=ulaval,DC=ca',
        searchFilter: '(cn={{username}})',
        searchAttributes: ['cn', 'givenName', 'sn', 'mail'],
      }
    };
    callback(null, opts);
  });
};

exports.setup = function (User, Auth) {
  passport.use(new LdapStrategy(getLDAPConfiguration,
    function(userLDAP, done) {
      console.log("Authentication with LDAP");
      console.log("cn:");
      console.log(userLDAP.cn);

      User.findOne({
        userName: userLDAP.cn,
        provider: 'idul'
      }, function(err, user) {
        if (err) {
          console.log(err);
          return done(err);
        }
        if (!user) {
          console.log("attempting to register LDAP user locally");
          console.log("user:");
          console.log(userLDAP);
          console.log("mail:");
          console.log(userLDAP.mail);

          user = new User({
            firstName: userLDAP.givenName,
            lastName: userLDAP.sn,
            email: userLDAP.mail,
            userName: userLDAP.cn,
            provider: 'idul',
            role: 'user',
          });
          user.save(function(err) {
            if (err) return done(err);
            return done(err, user);
          });
        } else {
          console.log("LDAP user exists in local database");
          return done(err, user);
        }
      });
    }
  ));
};
