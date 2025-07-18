'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var KObject = require('../KObject/KObject.model');
var config = require('../../config/environment');

exports.upload = function(req, res) {
    var file = req.files.file;
    var obj = {};
    obj.filename = file.originalFilename;
    obj.tmpFilename = file.path.split('\\').pop().split('/').pop();
    obj.size = file.size;
    obj.type = file.type;
    return res.status(200).json(obj);
};

exports.uploadAndUpdate = function(req, res){
    var body = req.body;
    var data = body.data;
    var file = body.file;
    var type = file.type;
    type = type.replace('/',"\\/");
    var reg = new RegExp("^data:" + type + ";base64,", "i");
    var base64Data = data.replace(reg, "");

    var commDir = path.join(config.attachmentsPath, file.communityId);
    if (fs.existsSync(commDir) === false) {
        fs.mkdirSync(commDir);
    }
    var contribDir = path.join(commDir, file._id);
    if (fs.existsSync(contribDir) === false) {
        fs.mkdirSync(contribDir);
    }
    var versionDir = path.join(contribDir, file.version.toString());
    if (fs.existsSync(versionDir) === false) {
        fs.mkdirSync(versionDir);
    }
    var newFile = path.join(versionDir, file.name);
    fs.writeFile(newFile, base64Data, 'base64', function(err) {
        if (err) {
            return handleError(res, err);
        }
        //update contribution attachment path
        var url = path.join(config.attachmentsURL, file.communityId, file._id, file.version.toString(), file.name);
        KObject.findById(file._id, function(err, contribution) {
            var updated = _.merge(contribution, {});
            updated.data.version = file.version;
            updated.data.url = url;
            updated.markModified('data');
            
            updated.save(function(err, newContribution) {
                if (err) {
                    return handleError(res, err);
                }
                return res.status(200).json(newContribution);
            });
        });
    });
};


exports.processAttachment = function(newobj) {
    var tmpFile = path.join(config.attachmentsPath, newobj.tmpFilename);
    if (fs.existsSync(tmpFile) === false) {
        throw 'tmpfile not found.';
    }

    // this part use recursive mkdir future
    var commDir = path.join(config.attachmentsPath, newobj.communityId);
    if (fs.existsSync(commDir) === false) {
        fs.mkdirSync(commDir);
    }
    var contribDir = path.join(commDir, newobj._id);
    if (fs.existsSync(contribDir) === false) {
        fs.mkdirSync(contribDir);
    }
    var versionDir = path.join(contribDir, newobj.data.version.toString());
    if (fs.existsSync(versionDir) === false) {
        fs.mkdirSync(versionDir);
    }
    var newFile = path.join(versionDir, newobj.data.filename);
    fs.renameSync(tmpFile, newFile);

    delete newobj.data.tmpFilename;
    newobj.data.url = path.join(config.attachmentsURL, newobj.communityId, newobj._id, newobj.data.version.toString(), newobj.data.filename);
};

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}

