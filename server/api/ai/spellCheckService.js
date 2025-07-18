'use strict';

var logService = require('./logService');
var Community = require('../KCommunity/KCommunity.model');
var KObject = require('../KObject/KObject.model');
var User = require('../user/user.model');
var aiApiService = require('./aiApiService');
var striptags = require('striptags');
var he = require('he');
var cheerio = require('cheerio');
var https = require('https');

function removeKfSupportStartLabel(html) {
    var $ = cheerio.load(html);
    $('span.kfSupportStartLabel').remove();
    $('img').remove();
    $('a').remove();
    return $.html();
}

function removeHtmlTagsAndDecodeHtml(text) {
    text = text.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
    text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
    var strippedText = striptags(text);
    var decodedText = he.decode(strippedText);
    decodedText = decodedText.replace(/\s+/g, ' ').trim();
    return decodedText;
}

function escapeSpecialChars(text) {
    return text.replace(/\\/g, '\\\\')
        .replace(/\"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

function processSpellCheck(req, res, logTexts) {
    console.log("Starting processSpellCheck");
    if (req.body && req.body.params && req.body.params.kf_user_id && req.body.params.community_id) {
        console.log("Params are defined");
        Community.findById(req.body.params.community_id, function (err, community) {
            if (err) {
                console.error("Error finding community:", err);
                return res.status(500).send(err);
            }
            KObject.findById(req.body.params.viewId, function (err, kobj) {
                if (err) {
                    console.error("Error finding KObject:", err);
                    return res.status(500).send(err);
                }
                User.findById(req.body.params.kf_user_id, function (err, user) {
                    if (err) {
                        console.error("Error finding user:", err);
                        return res.status(500).send(err);
                    }
                    if (!user) {
                        console.log("User not found");
                        return res.status(404).send('User not found');
                    }
                    logService.checkRequestLimit(user._id, function(err, requestInLast24h) {
                        if (err) {
                            console.error("Error checking request limit:", err);
                            return res.status(500).send(err);
                        }
                        if (requestInLast24h >= 400) {
                            console.log("Request limit reached");
                            return res.send(['Vous avez atteint la limite de 400 corrections par jour', 400 - requestInLast24h]);
                        }
                        var rawText = req.body.text;
                        rawText = removeKfSupportStartLabel(rawText);
                        rawText = removeHtmlTagsAndDecodeHtml(rawText);
                        rawText = escapeSpecialChars(rawText);

                        if (req.query.spell === "quick" || req.query.spell === "full") {
                            handleSpellCheck(req, res, rawText, user, kobj, community, requestInLast24h);
                        } else if (req.query.explain === "turboExplain" || req.query.explain === "turboExplain2" || req.query.explain === "turboExplain3") {
                            handleExplain(req, res, rawText, logTexts, user, kobj, community, requestInLast24h);
                        } else {
                            console.log("Invalid query parameter");
                            res.status(400).send("Invalid query parameter");
                        }
                    });
                });
            });
        });
    } else {
        console.log("Missing required parameters");
        res.status(400).send("Missing required parameters");
    }
}

function handleSpellCheck(req, res, rawText, user, kobj, community, requestInLast24h) {
    console.log("Starting handleSpellCheck");
    var model = "gpt-4o"; // Using the specified model
    var prompt = req.query.spell === "quick" ?
        "Tu corriges les fautes dans le texte suivant" :
        "Corrige les erreurs dans le texte sans trop réécrire. Entoure chaque erreur avec une balise '<strong>' et applique la couleur rouge via le CSS en ligne. Ensuite, fournis une énumération expliquant chaque correction. Ne retourne pas de markdown, mais uniquement du HTML avec du CSS en ligne. Ne retourne pas de balises HTML non nécessaires telles que '<html>', '<head>', '<body>', ou '<!DOCTYPE html>'. Enfin, retourne le texte corrigé à la fin, après l'énumération des corrections.\\n\\n";

    var gptPrompt = prompt + "\n\n" + rawText;

    var messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: gptPrompt }
    ];

    var data = JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
    });

    var options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer REDACTED_OPENAI_KEY`,
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var apiReq = https.request(options, (apiRes) => {
        res.setHeader('Content-Type', 'application/json');
        let accumulatedData = '';

        apiRes.on('data', (chunk) => {
            const chunkStr = chunk.toString('utf8');
            console.log('Received chunk:', chunkStr);
            accumulatedData += chunkStr;

            const lines = accumulatedData.split('\n');
            accumulatedData = lines.pop(); // Keep incomplete line for next chunk

            lines.forEach(line => {
                if (line.trim()) {
                    if (line === 'data: [DONE]') {
                        console.log("Stream finished");
                        res.write(JSON.stringify({ final: true, remainingRequests: 400 - requestInLast24h }) + '\n\n');
                        res.end();
                    } else if (line.startsWith('data: ')) {
                        try {
                            const jsonString = line.slice(6);
                            console.log('JSON string:', jsonString);
                            const parsedLine = JSON.parse(jsonString);
                            console.log('Parsed line:', parsedLine);
                            if (parsedLine.choices && parsedLine.choices.length > 0) {
                                const delta = parsedLine.choices[0].delta;
                                if (delta && delta.content) {

                                    const responseChunk = {

                                        partial: delta.content
                                    };
                                    res.write(JSON.stringify(responseChunk) + '\n\n');
                                    console.log('Sent chunk:', responseChunk);
                                }
                            }
                        } catch (err) {
                            console.error('Error parsing chunk:', err, 'Line content:', line);
                        }
                    }
                }
            });
        });

        apiRes.on('end', () => {
            console.log('API response ended');
            res.end();

            logService.saveLog(gptPrompt, rawText, user, kobj, community, req.body.params.contribution_id, function(err) {
                if (err) {
                    console.error('Error saving log:', err);
                }
            });
        });
    });

    apiReq.on('error', (e) => {
        console.error(`Error with OpenAI API: ${e.message}`);
        res.status(500).send(`Error with OpenAI API: ${e.message}`);
    });

    apiReq.write(data);
    apiReq.end();
}

const ageGroupInstructions = {
    "turboExplain": {
        ageRange: "étudiant de 6 à 11 ans",
        additionalInstructions: "Guide-le en donnant des recommandations simples et claires."
    },
    "turboExplain2": {
        ageRange: "étudiant de 11 à 16 ans",
        additionalInstructions: "Encourage l'analyse critique et la réflexion."
    },
    "turboExplain3": {
        ageRange: "étudiant universitaire",
        additionalInstructions: "Approfondis les concepts et encourage l'autonomie dans l'apprentissage et la citation de sources scientifique."
    }
};

function determineExplainAction(queryParam) {
    var actionDetails = ageGroupInstructions[queryParam];
    if (!actionDetails) return "Action non définie";

    return `Important ! Répondre uniquement en français et te référer aux autres contributions en citant leurs auteurs si cela est pertinent à tes recommandations. Tu dois donner des idées à un ${actionDetails.ageRange} pour l'aider à répondre au premier texte en prenant en compte ce qui a été dit auparavant.`;
}

function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.slice(0, maxLength);
    }
    return text;
}

// function handleExplain(req, res, rawText, logTexts, user, kobj, community, requestInLast24h) {
//     var actionIntroduction = determineExplainAction(req.query.explain);
//
//     var instructions = "Important! Répondre uniquement en français. " + actionIntroduction + " Voici tes instructions générales :\n\n";
//     instructions += "1. Concentre-toi sur le premier texte de la liste, qui est la contribution la plus récente.\n";
//     instructions += "2. Analyse les autres textes pour comprendre le contexte de la discussion.\n";
//     instructions += "3. Guide les étudiants en leur fournissant des recommandations et des idées pour qu'ils puissent développer leurs propres réponses au premier texte, en tenant compte du contexte fourni par les autres textes. Encourage-les à réfléchir de manière autonome, sans fournir de réponse directe.\n";
//     instructions += "4. Réfère-toi aux auteurs par leur nom et cite leurs contributions précédentes si pertinent.\n";
//     instructions += "5. Dans ta réponse, ne répète pas les instructions, donne directement tes suggestions.\n";
//
//     instructions += "Voici les textes, du plus récent au plus ancien:\n\n" + logTexts;
//
//     var totalCharacters = actionIntroduction.length + instructions.length;
//     console.log("Total number of characters:", totalCharacters);
//
//     const MAX_CHARACTERS = 18000; // Limite totale pour toutes les instructions
//     if (totalCharacters > MAX_CHARACTERS) {
//         var maxInstructionsLength = MAX_CHARACTERS - actionIntroduction.length;
//         instructions = truncateText(instructions, maxInstructionsLength);
//         console.log("Truncated instructions to fit within the limit.");
//     }
//     console.log("actionIntroduction", actionIntroduction);
//     console.log("instructions", instructions);
//     aiApiService.callRemoteMixtral(actionIntroduction, instructions, res)
//         .then(function(outputText) {
//             console.log("Explain - Raw output received:", outputText);
//             logService.saveLog(outputText, rawText, user, kobj, community, req.body.params.contribution_id, function(err) {
//                 if (err) {
//                     console.error("Explain - Error saving log:", err);
//                 }
//                 res.write(JSON.stringify({final: true, remainingRequests: 400 - requestInLast24h}));
//                 res.end();
//             });
//         })
//         .catch(function(error) {
//             res.status(500).send("Error in remoteMixtral: " + error);
//         });
// }


function handleExplain(req, res, rawText, logTexts, user, kobj, community, requestInLast24h) {
    console.log("Starting handleExplain");
    console.log("rawText"+rawText);
    var studentTempContribution = "";
    var llmResponse = ""
    if (rawText) {
        studentTempContribution = "Voici ce que l'étudiant que tu dois aider a commencé à écrire :\n" + rawText;
    }



    var model = "gpt-4o"; // Using the specified model
    var actionIntroduction = determineExplainAction(req.query.explain);
    var instructions = "Important! Répondre uniquement en français. " + actionIntroduction + " Voici tes instructions générales :\n\n";
    instructions += "1. Concentre-toi sur la première contribution de la liste, qui est la contribution la plus récente.\n";
    instructions += "2. Si il y en a d'autres, analyse les autres contributions pour comprendre le contexte de la discussion.\n";
    instructions += "3. Guide les étudiants en leur fournissant des recommandations et des idées pour qu'ils puissent développer leurs propres réponses.\n";
    instructions += "4. Réfère-toi aux auteurs par leur nom et cite leurs contributions précédentes si pertinent.\n";
    instructions += "5. Dans ta réponse, ne répète pas les instructions, donne directement tes suggestions et à la fin de ta réponse donne des ides en points de forme.\n";
    instructions += "6.     Ne retourne pas de markdown, mais uniquement du HTML avec du CSS en ligne. Ne retourne pas de balises HTML non nécessaires telles que '<html>', '<head>', '<body>', ou '<!DOCTYPE html>'\n";
    instructions += "Voici les textes, du plus récent au plus ancien:\n\n"+ studentTempContribution+ logTexts;


    var totalCharacters = actionIntroduction.length + instructions.length + rawText.length;
    const MAX_CHARACTERS = 20000; // Maximum limit for all instructions and text

    if (totalCharacters > MAX_CHARACTERS) {
        var maxInstructionsLength = MAX_CHARACTERS - actionIntroduction.length - rawText.length;
        instructions = truncateText(instructions, maxInstructionsLength);
        console.log("Truncated instructions to fit within the limit.");
    }

    var gptPrompt = instructions  + "\n\n" + rawText;

    console.log("les instruction" + gptPrompt);

    var messages = [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: gptPrompt }
    ];

    var data = JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true
    });

    var options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer REDACTED_OPENAI_KEY`,
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var apiReq = https.request(options, (apiRes) => {
        res.setHeader('Content-Type', 'application/json');
        let accumulatedData = '';

        apiRes.on('data', (chunk) => {
            const chunkStr = chunk.toString('utf8');
            accumulatedData += chunkStr;

            const lines = accumulatedData.split('\n');
            accumulatedData = lines.pop(); // Keep incomplete line for next chunk

            lines.forEach(line => {
                if (line.trim()) {
                    if (line === 'data: [DONE]') {
                        console.log("Stream finished");
                        res.write(JSON.stringify({ final: true, remainingRequests: 400 - requestInLast24h }) + '\n\n');
                        res.end();
                    } else if (line.startsWith('data: ')) {
                        try {
                            const jsonString = line.slice(6);
                            const parsedLine = JSON.parse(jsonString);
                            if (parsedLine.choices && parsedLine.choices.length > 0) {
                                const delta = parsedLine.choices[0].delta;
                                if (delta && delta.content) {
                                    llmResponse += delta.content;
                                    const responseChunk = {
                                        partial: delta.content
                                    };
                                    res.write(JSON.stringify(responseChunk) + '\n\n');
                                }
                            }
                        } catch (err) {
                            console.error('Error parsing chunk:', err);
                        }
                    }
                }
            });
        });

        apiRes.on('end', () => {
            console.log('API response ended');
            res.end();

            logService.saveLog(llmResponse, rawText, user, kobj, community, req.body.params.contribution_id, function(err) {
                if (err) {
                    console.error('Error saving log:', err);
                }
            });
        });
    });

    apiReq.on('error', (e) => {
        console.error(`Error with OpenAI API: ${e.message}`);
        res.status(500).send(`Error with OpenAI API: ${e.message}`);
    });

    apiReq.write(data);
    apiReq.end();
}


module.exports = {
    processSpellCheck: processSpellCheck
};
