'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KFeedbackSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    create: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        default: '1' //1 - New, 2 - Assigned, 3 - In Progress, 4 - Closed
    }
});

var KFeedback = mongoose.model('KFeedback', KFeedbackSchema);

module.exports = KFeedback;