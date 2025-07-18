'use strict';

var express = require('express');
var controller = require('./recaptcha.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/config', controller.getConfig);
router.post('/', controller.verifyResponse);

module.exports = router;
