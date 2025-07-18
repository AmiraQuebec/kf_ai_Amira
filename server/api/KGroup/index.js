'use strict';

var express = require('express');
var controller = require('./KGroup.controller');

var router = express.Router();

var commauth = require('../../auth/commauth.service');

router.post('/:communityId', commauth.isAuthenticated(), controller.create);

module.exports = router;