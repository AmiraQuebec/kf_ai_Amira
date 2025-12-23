'use strict';
var mongoose = require('mongoose');
var uri   = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kf6';
var EMAIL = process.env.USER_EMAIL;
if (!EMAIL) { console.error('Set USER_EMAIL'); process.exit(1); }

mongoose.Promise = global.Promise;
mongoose.connect(uri, {}, function(err){
  if (err) { console.error('Mongo connect error:', err); process.exit(1); }
  var User = require('./server/api/user/user.model');
  User.findOne({ email: EMAIL }, function(e, u){
    if (e)   { console.error(e); return done(1); }
    if (!u)  { console.error('User not found:', EMAIL); return done(2); }

    // Compat: vieux schémas et nouveaux
    u.role = 'admin';
    var arr = Array.isArray(u.roles) ? u.roles.slice() : [];
    Array.prototype.push.apply(arr, ['admin','manager']);
    u.roles = arr.filter(function(v,i,a){ return a.indexOf(v)===i; });

    // Flags parfois utilisés par l'UI
    u.isAdmin = true;
    u.isManager = true;

    // Certaines variantes stockent des "permissions"
    if (Array.isArray(u.permissions)) {
      u.permissions = u.permissions.concat(['admin','manager'])
        .filter(function(v,i,a){ return a.indexOf(v)===i; });
    }

    u.save(function(se){
      if (se) { console.error(se); return done(1); }
      console.log('UPDATED:', {
        email: u.email, role: u.role, roles: u.roles,
        isAdmin: u.isAdmin, isManager: u.isManager, permissions: u.permissions
      });
      return done(0);
    });
  });

  function done(code){ mongoose.connection.close(function(){ process.exit(code); }); }
});
