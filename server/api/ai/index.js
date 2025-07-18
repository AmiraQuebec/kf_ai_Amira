'use strict';

var express = require('express');
var controller = require('./ai.controller');

var router = express.Router();

router.post('/spellCheck', controller.spellCheck);

module.exports = router;
