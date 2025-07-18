'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NotificationSchema = new Schema({
    email: { type: String, required: true, index: true },
    time: {
        type: Date,
        default: Date.now
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
        default: {}
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
