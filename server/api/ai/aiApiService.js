'use strict';

var http = require('http');

function callRemoteMixtral(action, inputText, res) {
    return new Promise(function(resolve, reject) {
        var data = JSON.stringify({
            action: action,
            inputText: inputText,
            temperature: 0.7,
            max_tokens: -1,
            stream: true
        });

        var options = {
            hostname: '132.203.113.141',
            port: 80,
            path: '/llm',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'x-api-key': 'RvdUhfQp6GzkPbPzQppyBSeWBpgECX3544Rs3QJ4XKFRWKSyNvKJ8ec7ia'
            }
        };

        var req = http.request(options, function(apiRes) {
            apiRes.setEncoding('utf8');
            var accumulatedData = '';
            var partialResponse = '';

            apiRes.on('data', function(chunk) {
                console.log('Received raw chunk:', chunk.toString());

                accumulatedData += chunk;

                try {
                    var lines = accumulatedData.split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i].trim();
                        if (line) {
                            try {
                                var json = JSON.parse(line);
                                if (json.choices && json.choices[0].delta) {
                                    var content = json.choices[0].delta.content || '';
                                    console.log('Processed chunk:', content);
                                    partialResponse += content;
                                    res.write(JSON.stringify({partial: partialResponse}));
                                }
                            } catch (innerError) {
                                // Si ce n'est pas un JSON valide, vérifier si c'est le format LLM local
                                if (line.startsWith('data: ')) {
                                    var jsonStr = line.slice(6);
                                    if (jsonStr === '[DONE]') {
                                        res.write(JSON.stringify({final: true, content: partialResponse}));
                                        resolve(partialResponse);
                                        return;
                                    }
                                    try {
                                        var localJson = JSON.parse(jsonStr);
                                        if (localJson.choices && localJson.choices[0].delta) {
                                            var localContent = localJson.choices[0].delta.content || '';
                                            console.log('Processed local chunk:', localContent);
                                            partialResponse += localContent;
                                            res.write(JSON.stringify({partial: partialResponse}));
                                        }
                                    } catch (localError) {
                                        console.error('Error parsing JSON in LLM local format:', localError);
                                    }
                                }
                            }
                        }
                    }
                    accumulatedData = lines[lines.length - 1];
                } catch (e) {
                    console.error('Error processing chunk:', e);
                }
            });

            apiRes.on('end', function() {
                console.log('Stream ended');
                res.write(JSON.stringify({final: true, content: partialResponse}));
                resolve(partialResponse);
            });
        });

        req.on('error', function(e) {
            console.error('Request error:', e);
            reject("An error occurred during API interaction: " + e.message);
        });

        req.write(data);
        req.end();
    });
}

module.exports = {
    callRemoteMixtral: callRemoteMixtral
};
