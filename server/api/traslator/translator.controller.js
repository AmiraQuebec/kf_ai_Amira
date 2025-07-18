
var request = require('request');



exports.translate=function (req,res){
var subscriptionKey = '027c1693482b4c03930a74e530f8895d';
var endpoint = 'https://api.translator.azure.cn/';
   var options = {
        method: 'POST',
        baseUrl: endpoint,
        url: 'translate',
        qs: {
          'api-version': '3.0',
          'to': [req.query.language],
          'textType':'plain'
        },
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-type': 'application/json'
        },
        body: [{
              'text': req.query.text
        }],
        json: true,
    };
    request(options, function(error, response, body){
        if (error || body.error) {
          if(error){
            console.error(error);
          }else{
            console.error(body.error);
          }
            return res.json({ "responseDesc": "Failed translation"});
        } else if(body[0]!== undefined)
        {
        res.json({"responseDesc": "Success","text":body[0].translations[0].text})
        }else{
            res.json({ "responseDesc": "Failed translation"});
        }
        
    });
};
