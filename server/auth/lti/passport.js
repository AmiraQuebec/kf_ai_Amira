exports.setup = function (User, config) {
    var passport = require('passport');
    var LTIStrategy = require('passport-lti').Strategy;
    passport.use(new LTIStrategy({
        consumerKey: process.env.MOODLE_KEY,
        consumerSecret: process.env.MOODLE_SECRET,
    }, function (ltiprovider, done) {
        User.findOne({
            'userName': 'lti_' +ltiprovider.tool_consumer_instance_name.replace(/\s+/g,'')+'_'+ltiprovider.user_id
        }, function (err, user) {
            if (!user) {
                user = new User({
                    provider: 'lti',
                    firstName: ltiprovider.lis_person_name_given,
                    lastName: ltiprovider.lis_person_name_family,
                    email: ltiprovider.lis_person_contact_email_primary,
                    userName: 'lti_' +ltiprovider.tool_consumer_instance_name.replace(/\s+/g,'')+'_'+ltiprovider.user_id,
                    role: 'user',
                    ltiData: ltiprovider
                });
                user.save(function (err) {
                    if (err) done(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
    }));
};
