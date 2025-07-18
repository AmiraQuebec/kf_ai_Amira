'use strict';

var express = require('express');
var controller = require('./KContribution.controller');
var commauth = require('../../auth/commauth.service');

var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/:communityId', commauth.isAuthenticated(), controller.create);
router.get('/:communityId/studentNotes', controller.getNotesInCommunity);
router.post('/:communityId/search/count', commauth.isAuthenticated(), controller.searchCount);
router.post('/:communityId/search', commauth.isAuthenticated(), controller.search);
router.get('/:communityId/:contributionId', commauth.isAuthenticated(), controller.getContribution);

module.exports = router;
