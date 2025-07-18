'use strict';

var Log = require('./ai.model');

function checkRequestLimit(userId, callback) {
    Log.find({ userID: userId }, function (err, logs) {
        if (err) { return callback(err); }
        var requestInLast24h = countLogsLast24Hours(logs);
        callback(null, requestInLast24h);
    });
}

function countLogsLast24Hours(logs) {
    var now = new Date();
    var last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    var count = logs.filter(function(log) {
        return new Date(log.timestamp) >= last24Hours;
    }).length;
    return count;
}

function saveLog(outputText, rawText, user, kobj, community, contributionId, callback) {
    // Check if the necessary objects are null and log an error if they are
    if (!user || !user._id) {
        console.error("Invalid user object", {user: user});
        return callback(new Error("Invalid user object"));
    }
    if (!kobj || !kobj._id) {
        console.error("Invalid kobj object", {kobj: kobj});
        return callback(new Error("Invalid kobj object"));
    }
    if (!community || !community._id) {
        console.error("Invalid community object", {community: community});
        return callback(new Error("Invalid community object"));
    }

    // Proceed to create a log entry if all objects are valid
    var log = new Log({
        viewId: kobj._id,
        viewName: kobj.title,
        communityId: community._id,
        communityName: community.title,
        userID: user._id,
        userName: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        textOriginal: rawText,
        textCorrected: outputText,
        contribution_id: contributionId
    });

    log.save(callback);
}


module.exports = {
    checkRequestLimit: checkRequestLimit,
    saveLog: saveLog
};
