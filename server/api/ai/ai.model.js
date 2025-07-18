'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AiSchema = new Schema({
    userName : String,
    firstName : String,
    lastName : String,
    userID : String,
    communityId : String,
    viewId : String,
    viewName: String,
    communityName : String,
    timestamp: { type: Date, default: Date.now },
    textOriginal: String,
    textCorrected: String,
    contribution_id: String
});

module.exports = mongoose.model('Ai', AiSchema);
