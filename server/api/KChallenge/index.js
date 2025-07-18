'use strict';

var express = require('express');
var controller = require('../KChallenge/KChallenge.controller');
var commauth = require('../../auth/commauth.service');

var router = express.Router();

router.post('/get/:communityId', controller.get);
router.post('/count/:communityId', controller.count);
router.get('/:id', controller.getOne);
router.post('/:communityId', /*commauth.isAuthenticated(),*/ controller.create);

module.exports = router;
