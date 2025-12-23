var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/kf6-tact', {}, function(err){
  if (err) return console.error(err), process.exit(1);
  var db = mongoose.connection.db;
  
  // Trouver l'utilisateur
  db.collection('users').findOne({email: 'amira-zguira@hotmail.com'}, function(err, user){
    if (!user) return console.error('User not found'), process.exit(1);
    
    // Mettre à jour la communauté pour ajouter l'utilisateur comme manager
    db.collection('kcommunities').findOneAndUpdate(
      {title: 'test'},
      {
        $addToSet: {
          managers: user._id,
          members: user._id
        }
      },
      {returnOriginal: false},
      function(err, result){
        if (err) return console.error(err), process.exit(1);
        console.log('Communauté mise à jour');
        console.log('Vous êtes maintenant manager de la communauté "test"');
        
        // Mettre à jour l'utilisateur
        db.collection('users').updateOne(
          {email: 'amira-zguira@hotmail.com'},
          {$addToSet: {communities: result.value._id}},
          function(){
            console.log('Déconnectez-vous et reconnectez-vous pour voir les changements');
            mongoose.connection.close(()=>process.exit(0));
          }
        );
      }
    );
  });
});
