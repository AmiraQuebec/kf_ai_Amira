'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var KContribution = require('../KContribution/KContribution.model');
var KLink = require('../KLink/KLink.model');
var KChallenge = require('./KChallenge.model')
var KRecordController = require('../KRecord/KRecord.controller.js');
var KLinkController = require('../KLink/KLink.controller.js');
var contributionIds;

// Creates a new contribution in the DB.
exports.create = function(req, res) {
    var challenge = req.body.challenge;
    var query = challenge.newobj;
    delete challenge.newobj;
    createChallenge(challenge, res);
    // KContribution.create(query, function(err, contribution) {
    //     if (err) {
    //         return handleError(res, err);
    //     }
    //     KRecordController.createInternal({
    //         authorId: query.authors[0],
    //         targetId: contribution._id,
    //         type: 'created'
    //     });

    //     createChallenge(challenge, contribution._id, res);
    // });
};

function createChallenge(c, res){
    KChallenge.create(c, function(err, challenge){
        if(err){
            return handleError(res, err);
        }
        return res.status(201).json(challenge);
    });
}

exports.getOne = function(req, res) {
  var id = req.params.id;
  KChallenge.findById(id, function(err, challenge){
    if(err){
      return handleError(res, err);
    }
    return res.status(200).json(challenge);
  });
}

exports.get = function(req, res) {
    if (!req.body.query) {
      console.error('search parameter error: ' + req.body);
      return res.sendStatus(400);
    }

    var query = req.body.query;

    var pagesize = query.pagesize ? query.pagesize : 50;
    pagesize = parseInt(pagesize);
    var page = query.page ? query.page : 1;
    var skip = pagesize * (page - 1);
    KChallenge.find().skip(skip).
    limit(pagesize).
    exec(function(err, challenges) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(challenges);
    });
};

exports.count = function(req, res){
      KChallenge.count({}, function(err, count) {
          if (err) {
              return handleError(res, err);
          }
          return res.status(200).json({
              count: count
          });
      });
}

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}
