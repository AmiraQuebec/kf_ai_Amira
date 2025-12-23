var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/kf6-tact', {}, function(err){
  if (err) return console.error(err), process.exit(1);
  var User = require('./server/api/user/user.model');
  User.findOneAndUpdate(
    { email: 'amira-zguira@hotmail.com' },
    { $set: { role: 'admin', isAdmin: true } },
    { new: true },
    function(err, u){
      if (err) return console.error(err), process.exit(1);
      console.log('Admin restauré:', u.email);
      mongoose.connection.close(()=>process.exit(0));
    }
  );
});
