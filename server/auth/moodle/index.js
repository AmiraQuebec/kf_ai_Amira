'use strict';
var User = require('../../api/user/user.model');
var express = require('express');
var lti = require("ims-lti");
var passport = require('passport');
var auth = require('../auth.service');
var CustomStrategy = require('passport-custom').Strategy;
var router = express.Router();


passport.use('custom', new CustomStrategy(
    function (req, done) {
        var moodleData = new lti.Provider(process.env.MOODLE_KEY, process.env.MOODLE_SECRET);
        var ltiprovider = moodleData.body;
        moodleData.valid_request(req, (err, isValid) => {
            console.log(ltiprovider);
            if (ltiprovider.custom_lti_kf_key !== process.env.LTI_KF_KEY) {
                console.log("Bad key");
                return done("Bad key");
            } else {
                console.log("Good key");
                User.findOne({userName: 'moodle_' + ltiprovider.lis_person_name_full.replace(/\s+/g, '') + '_' + ltiprovider.user_id}, function (err, user) {
                    if (!user) {
                        user = new User({
                            provider: 'moodle',
                            firstName: ltiprovider.lis_person_name_given,
                            lastName: ltiprovider.lis_person_name_family,
                            email: ltiprovider.lis_person_contact_email_primary,
                            userName: 'moodle_' + ltiprovider.lis_person_name_full.replace(/\s+/g, '') + '_' + ltiprovider.user_id,
                            role: 'user',
                            ltiData: ltiprovider
                        });
                        console.log("new moodle user" + user);
                        user.save(function (err) {
                            if (err) done(err);
                            return done(err, user);
                        });
                    } else {
                        console.log("moodle user found " + user);
                        return done(err, user);
                    }
                });
            }
        });
    }
));

router.post('/', function (req, res, next) {
    passport.authenticate('custom', function (err, user, info) {
        var error = err || info;
        if (error) {
            console.log(error);
            return res.status(401).json(error);
        }
        if (!user) return res.status(404).json({message: 'Something went wrong, please try again.'});
        auth.setTokenCookie({user:user},res);
    })(req, res, next)
});


module.exports = router;
