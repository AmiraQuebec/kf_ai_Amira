'use strict';
var mongoose = require('mongoose');
var uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kf6-tact';
var EMAIL = process.env.USER_EMAIL;
var ROLE  = process.env.USER_ROLE || 'admin';
if (!EMAIL) { console.error('Set USER_EMAIL'); process.exit(1); }
mongoose.Promise = global.Promise;
mongoose.connect(uri, {}, function(err){
  if (err) return console.error(err), process.exit(1);
  var User = require('./server/api/user/user.model');
  User.findOneAndUpdate({ email: EMAIL }, { $set: { role: ROLE } }, { new: true }, function(err, u){
    if (err) { console.error(err); return done(1); }
    if (!u)   { console.error('User not found:', EMAIL); return done(1); }
    console.log('Role updated:', u.email, '->', u.role);
    done(0);
  });
  function done(code){ mongoose.connection.close(()=>process.exit(code)); }
});
