'use strict';

var express = require('express');
var controller = require('./translator.controller');

var router = express.Router();


router.get('/', controller.translate);
module.exports = router;