'use strict';

var express = require('express');
var controller = require('./notification.controller');

var router = express.Router();

router.post('/notify/:communityId', controller.notify);
router.get('/tick', controller.tick);

module.exports = router;
