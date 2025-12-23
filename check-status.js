var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/kf6-tact', {}, function(err){
  if (err) return console.error(err), process.exit(1);
  var db = mongoose.connection.db;
  
  db.collection('kcommunities').findOne({title: 'test'}, function(err, comm){
    if (comm) {
      console.log('Communauté:', comm.title);
      console.log('Code membre:', comm.registrationKey);
      console.log('Code MANAGER:', comm.managerRegistrationKey);
      console.log('\nUtilisez le code "' + comm.managerRegistrationKey + '" pour être manager!');
    }
    mongoose.connection.close(()=>process.exit(0));
  });
});
