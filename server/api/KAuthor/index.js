'use strict';

var express = require('express');
var controller = require('./KAuthor.controller');

var router = express.Router();

var auth = require('../../auth/auth.service');
var commauth = require('../../auth/commauth.service');

router.get('/:communityId/me', commauth.isAuthenticated(), controller.me);
router.post('/', auth.isAuthenticated(), controller.create);
router.post('/search/count/:communityId', auth.hasRole('manager'), controller.searchCount);
router.post('/search/writer/:communityId', auth.hasRole('manager'), controller.searchWriters);

module.exports = router;
