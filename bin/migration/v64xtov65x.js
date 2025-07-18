//Migration Script
//From KF6.4.x -> 6.5.x
//Usage:
//$mongo [db description] [jsfile]
//$mongo localhost/kf6 this.js

print('=====================');
print('Change 6.4.x -> 6.5.x');
print('=====================');
db.users.find({
    $and: [{
        username: {
            $exists: false
        },
        userName: {
            $exists: false
        }
    }]
}).forEach(function(user) {
    print('User Found: ' + user.email);
    user.userName = user.email;
    db.users.save(user);
    db.kobjects.find({
        $and: [{
            userId: user._id
        }, {
            type: 'Author'
        }]
    }).forEach(function(author) {
        print('Author Found: ' + author.userName);
        print('email: ' + author.email);
        author.userName = user.userName;
        author.email = user.email;
        db.kobjects.save(author);
    });
});

print('=====================');
print('Christian\'s version -> 6.5.x');
print('=====================');
db.users.find({
    $and: [{
        username: {
            $exists: true
        },
        userName: {
            $exists: false
        }
    }]
}).forEach(function(user) {
    print('User Found: ' + user.username);
    user.userName = user.username;
    db.users.save(user);
    db.kobjects.find({
        $and: [{
            userId: user._id
        }, {
            type: 'Author'
        }]
    }).forEach(function(author) {
        print('Author Found: ' + author.userName);
        print('email: ' + author.email);
        author.userName = user.userName;
        author.email = user.email;
        db.kobjects.save(author);
    });
});