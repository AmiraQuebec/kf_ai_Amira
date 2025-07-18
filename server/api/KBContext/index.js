'use strict';

var express = require('express');
var controller = require('./KBContext.controller');

var router = express.Router();

var auth = require('../../auth/auth.service');
var commauth = require('../../auth/commauth.service');

router.post('/:communityId', commauth.isAuthenticated(), controller.create);
router.get('/:viewId', commauth.isAuthenticated(), controller.show);

module.exports = router;