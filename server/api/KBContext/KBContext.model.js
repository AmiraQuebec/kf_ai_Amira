'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KBContextSchema = new Schema({
	//nothing special
});

var KObject = require('../KObject/KObject.model');
var KBContext = KObject.discriminator('KBContext', KBContextSchema);

module.exports = mongoose.model('KBContext', KBContextSchema);
