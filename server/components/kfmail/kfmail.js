'use strict';

try {
    var settings = require('./../../../settings.js').mail;
    var enabled = true;
} catch (e) {
    var enabled = false;
    if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
        console.warn('The file setting.js doesn\'t exist or doesn\'t contain required information. Mail disabled');
    } else {
        throw e;
    }
}

var nodemailer = require('nodemailer');

exports.send = function(to, subject, body) {
    if (!enabled) {
        return;
    }
    var transporter = nodemailer.createTransport(settings.transportOptions);
    var options = {
        from: settings.from,
        to: to,
        subject: subject,
        text: body
    };
    transporter.sendMail(options, function(err, res) {
        if (err) {
            console.error(err);
        } else {
            console.info('Message sent: ' + res.message);
        }
    });
}

exports.getBaseURL = function() {
    return settings.baseURL;
}
