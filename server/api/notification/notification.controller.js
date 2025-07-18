'use strict';

var _ = require('lodash');
var KLink = require('../KLink/KLink.model');
var Notification = require('./notification.model');
var kfmail = require('../../components/kfmail/kfmail.js');

exports.notify = function(req, res) {
    var contextId = req.body.contextId;

    /* Don't make any notification for private note */
    var note = req.body.contribution;
    if (note.permission === 'private') {
        return;
    }
    KLink.find({
        from: contextId,
        type: 'notifies'
    }, function(err, links) {
        if (err) {
            console.error(err);
            return;
        }
        links.forEach(function(link) {
            var email = link._to.email;
            if (email) {
                push(email, req.body);
            }
        });
    });
    res.sendStatus(200);
}

function push(email, notification) {
    if (email) {
        var seed = {};
        seed.email = email;
        seed.data = notification;
        Notification.create(seed, function(err) {
            if (err) {
                return console.error(err);
            }
        });
    }
}

exports.tick = function(req, res) {
    Notification.aggregate({
            $group: {
                _id: '$email',
                count: { $sum: 1 }
            }
        },
        function(err, res) {
            if (err) {
                return console.error(err);
            }
            res.forEach(function(each) {
                sendForOneAuthor(each._id);
            });
        });
    res.sendStatus(200);
}

function sendForOneAuthor(email) {
    Notification.find({ email: email }, function(err, res) {
        if (err) {
            return console.error(err);
        }
        var content = '';
        res.forEach(function(each) {
            var notification = each.data;
            var time = each.time;
            var author = notification.author;
            var note = notification.contribution
            content += 'edited: ';
            content += '"' + note.title + '" ';
            content += 'by ' + author.firstName + ' ' + author.lastName + ' ';
            content += 'at ' + time + ' ';
            content += '\n';
            content += kfmail.getBaseURL() + 'contribution/' + note._id;
            content += '\n';
            content += '\n';
            each.remove();
        });

        var subject = '[KF6 notification] at ' + new Date().toString();
        kfmail.send(email, subject, content);
    });
}

function handleError(res, err) {
    return res.send(500, err);
}
