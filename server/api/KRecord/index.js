'use strict';

var express = require('express');
var controller = require('./KRecord.controller');

var router = express.Router();
var commauth = require('../../auth/commauth.service');

router.get('/:id', controller.show);
/*router.get('/object/:objectId', commauth.isAuthenticated(), controller.indexOfContribution);*/
router.get('/object/:objectId', controller.index);

router.get('/myreadstatus/:communityId/:contributionId', commauth.isAuthenticated(), controller.myReadStatus);
router.get('/myreadstatusview/:communityId/:viewId', commauth.isAuthenticated(), controller.myReadStatusView);
router.post('/read/:communityId/:contributionId', commauth.isAuthenticated(), controller.read);

/* for custom log */
router.post('/:communityId', commauth.isAuthenticated(), controller.create);
router.post('/search/:communityId', commauth.isAuthenticated(), controller.search);

// deprecated use search
router.get('/mine/:communityId', commauth.isAuthenticated(), controller.mine);

module.exports = router;
