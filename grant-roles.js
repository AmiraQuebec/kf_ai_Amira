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
    if (e) { console.error(e); return done(1); }
    if (!u) {
      console.error('User not found:', EMAIL);
      return done(2);
    }
    // Compat anciens schémas : role (string) + roles (array)
    u.role  = 'admin';
    var arr = Array.isArray(u.roles) ? u.roles.slice() : [];
    arr.push('admin','manager');
    // dédoublonner
    u.roles = arr.filter((v,i,a)=>a.indexOf(v)===i);

    u.save(function(se){
      if (se) { console.error(se); return done(1); }
      console.log('OK:', u.email, 'role=', u.role, 'roles=', u.roles);
      return done(0);
    });
  });

  function done(code){ mongoose.connection.close(()=>process.exit(code)); }
});
