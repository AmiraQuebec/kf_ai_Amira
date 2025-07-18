'use strict';

var express = require('express');
var controller = require('./KHistoricalObject.controller');
var commauth = require('../../auth/commauth.service');

var router = express.Router();

router.get('/:id', /*commauth.checkPermissionById('r'), */controller.show);
router.post('/:communityId/search', commauth.isAuthenticated(), controller.search);

module.exports = router;
