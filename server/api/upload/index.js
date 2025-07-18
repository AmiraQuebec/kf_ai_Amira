'use strict';

var express = require('express');
var controller = require('./upload.controller');
var fs = require('fs');
var config = require('../../config/environment');
var multipart = require('connect-multiparty');
var app = require('../../app');

var router = express.Router();

/* for attachments */
if (fs.existsSync(config.attachmentsPath) === false) {
    var res = fs.mkdirSync(config.attachmentsPath);
}
//auth does not work because img will be retrieved the browser auth, not angular $http auth
//app.use('/uploads', auth.isAuthenticated(), express.static(config.attachmentsPath));
app.use(config.attachmentsURL, express.static(config.attachmentsPath));

/* for attachments upload */
var multipartMiddleware = multipart({
    uploadDir: config.attachmentsPath
});
router.post('/', multipartMiddleware, controller.upload);
router.post('/newImage', controller.uploadAndUpdate);

module.exports = router;