'use strict';

var KLink = require('../KLink/KLink.model');
var KObject = require('../KObject/KObject.model');

function findRelatedKObjects(contributionId, callback) {
    // Trouver et ajouter la contribution principale
    KObject.findById(contributionId, function(err, mainKObject) {
        if (err) {
            return callback(err);
        }
        var logTexts = '';
        if (mainKObject && mainKObject.text4search) {
            if (mainKObject.authors && mainKObject.authors.length > 0) {
                var authorId = mainKObject.authors[0];
                KObject.findById(authorId, function(err, author) {
                    if (err) {
                        console.error("Error fetching author:", err);
                        logTexts += formatKObject(mainKObject, "Auteur inconnu");
                        findKLinksAndProcess(mainKObject, contributionId, logTexts, callback);
                    } else if (author) {
                        logTexts += formatKObject(mainKObject, author.firstName + " " + author.lastName);
                        findKLinksAndProcess(mainKObject, contributionId, logTexts, callback);
                    } else {
                        logTexts += formatKObject(mainKObject, "Auteur non trouvé");
                        findKLinksAndProcess(mainKObject, contributionId, logTexts, callback);
                    }
                });
            } else {
                logTexts += formatKObject(mainKObject, "Auteur non spécifié");
                findKLinksAndProcess(mainKObject, contributionId, logTexts, callback);
            }
        } else {
            findKLinksAndProcess(mainKObject, contributionId, logTexts, callback);
        }
    });
}

function findKLinksAndProcess(mainKObject, contributionId, logTexts, callback) {
    findKLinks([contributionId], [contributionId], function(err, allIds) {
        if (err) {
            return callback(err);
        }
        processUniqueIds(allIds, logTexts, callback);
    });
}

function findKLinks(ids, foundIds, callback) {
    KLink.find({
        $or: [
            { from: { $in: ids } },
            { to: { $in: ids } }
        ],
        type: "buildson"
    }).exec(function(err, results) {
        if (err) {
            return callback(err);
        }

        var newIds = [];
        results.forEach(function(result) {
            if (foundIds.indexOf(result.from.toString()) === -1) {
                newIds.push(result.from.toString());
            }
            if (foundIds.indexOf(result.to.toString()) === -1) {
                newIds.push(result.to.toString());
            }
        });
        if (newIds.length === 0) {
            return callback(null, foundIds);
        }
        foundIds = foundIds.concat(newIds);
        findKLinks(newIds, foundIds, callback);
    });
}

function processUniqueIds(ids, logTexts, callback) {
    var count = 0;

    ids.forEach(function(id) {
        KObject.findById(id, function(err, kobj) {
            if (err) {
                console.error("Error fetching KObject:", err);
                checkCompletion();
            } else if (kobj && kobj.text4search) {
                if (kobj.authors && kobj.authors.length > 0) {
                    var authorId = kobj.authors[0];
                    KObject.findById(authorId, function(err, author) {
                        if (err) {
                            console.error("Error fetching author:", err);
                            logTexts += formatKObject(kobj, "Auteur inconnu");
                        } else if (author) {
                            logTexts += formatKObject(kobj, author.firstName + " " + author.lastName);
                        } else {
                            logTexts += formatKObject(kobj, "Auteur non trouvé");
                        }
                        checkCompletion();
                    });
                } else {
                    logTexts += formatKObject(kobj, "Auteur non spécifié");
                    checkCompletion();
                }
            } else {
                checkCompletion();
            }
        });
    });

    function checkCompletion() {
        count++;
        if (count === ids.length) {
            callback(null, logTexts);
        }
    }
}

function formatKObject(kobj, authorName) {
    let formattedText = "=== Contribution de " + authorName + " ===\n";
    formattedText += "Titre: " + kobj.title + "\n";
    formattedText += "Contenu:\n" + kobj.text4search + "\n";
    formattedText += '=== Fin de la contribution ===\n\n';
    return formattedText;
}

module.exports = {
    findRelatedKObjects: findRelatedKObjects
};
