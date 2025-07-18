'use strict';

var spellCheckService = require('./spellCheckService');
var kObjectService = require('./kObjectService');

exports.spellCheck = function (req, res) {
    var contributionId = req.body.params.contribution_id;

    if (!contributionId) {
        return res.status(400).send('Contribution ID is required');
    }

    kObjectService.findRelatedKObjects(contributionId, function(err, logTexts) {
        if (err) {
            return res.status(500).send('Error fetching data');
        }

        spellCheckService.processSpellCheck(req, res, logTexts);
    });
};
