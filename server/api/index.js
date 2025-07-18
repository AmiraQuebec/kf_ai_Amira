'use strict';

var express = require('express');
var router = express.Router();

var pkg = require('../../package.json');
var version = pkg.version;
var versions = pkg.version.split('.');
var major = versions[0];
var minor = versions[1];
var patch = versions[2];
var build = pkg.build;

router.get('/version', function(req, res) {
  return res.json({
    version: version,
    major: major,
    minor: minor,
    patch: patch,
    build: build
  });
});

var parseChangelog = require('changelog-parser')

router.get('/changeLog', function(req, res) {
  var filePath = require('path').resolve(__dirname, '../../CHANGELOG.md');
  parseChangelog({
    filePath: filePath,
    removeMarkdown: false 
  })
  .then(function (result) {
    return res.status(201).json(result);
  })
  .catch(function (err) {
    console.error(err);
    return res.status(500, err);
  })
  
});

module.exports = router;
