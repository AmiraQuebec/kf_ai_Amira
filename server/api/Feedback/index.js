'use strict';

var express = require('express');
var controller = require('./feedback.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/send', auth.isAuthenticated(), controller.saveAndSend);

module.exports = router;