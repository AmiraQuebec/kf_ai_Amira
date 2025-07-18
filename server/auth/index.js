'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../api/user/user.model');
var googleOAuthClient = require('./googleOAuthClient.service');

// Passport Configuration
require('./local/passport').setup(User, config);
require('./facebook/passport').setup(User, config);
require('./google/passport').setup(User, config);
require('./twitter/passport').setup(User, config);
require('./idul/passport').setup(User, config);
// require('./lti/passport').setup(User, config);


var router = express.Router();

router.use('/local', require('./local'));
router.use('/facebook', require('./facebook'));
router.use('/twitter', require('./twitter'));
router.use('/google', require('./google'));
router.use('/idul', require('./idul'));
router.post('/googleOAuth/getOAuthUrl', googleOAuthClient.getOAuthUrl);
router.post('/googleOAuth/checkStatus', googleOAuthClient.checkStatus);
router.get('/googleOAuth/getToken', googleOAuthClient.getToken);
router.post('/googleOAuth/message/send', googleOAuthClient.putMessage);
router.post('/googleFile/create', googleOAuthClient.createFile);
router.post('/googleFile/export', googleOAuthClient.exportFile);
router.post('/googleFile/addPermission', googleOAuthClient.addPermission);
router.post('/googleFile/list', googleOAuthClient.getList);
router.post('/googleFile/importFromDrive', googleOAuthClient.importFromDrive);
//use LTI routes
// router.use('/lti', require('./lti'));
router.use('/moodle', require('./moodle'));

module.exports = router;
