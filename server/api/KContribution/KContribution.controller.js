'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
function oid(id){ try { return mongoose.Types.ObjectId(id); } catch(e){ return null; }}
var mongoose = require('mongoose');

var KContribution = require('./KContribution.model');
var KLink = require('../KLink/KLink.model');
var KRecordController = require('../KRecord/KRecord.controller.js');
var KLinkController = require('../KLink/KLink.controller.js');

var KAuthor = require('../KAuthor/KAuthor.model');

exports.getContribution = function(req, res) {
    res.cookie('token', JSON.stringify(req.query.access_token));
    return res.redirect('/contribution/' + req.params.contributionId);
};

// Creates a new contribution in the DB.
exports.create = function(req, res) {
    if (!_.includes(req.body.authors, req.author._id.toString())) {
        console.error(req.body.authors)
        console.error(req.author._id);
        console.error('author must be included in authors.');
        return res.sendStatus(403);
    }
    console.log('req.body :',req.body)
    KContribution.create(req.body, function(err, contribution) {
        if (err) {
            return handleError(res, err);
        }
        console.log('contribution created:',contribution);
        KRecordController.createInternal({
            authorId: req.author._id,
            targetId: contribution._id,
            type: 'created'
        });
        if (req.body.buildson) {
            exports.createBuildsOn(req, res, contribution, req.body.buildson, function(err) {
                if (err) {
                    return handleError(res, err);
                }
                return res.status(201).json(contribution);
            });
            return;
        }
        return res.status(201).json(contribution);
    });
};
///Get notes and authors of community
exports.getNotesInCommunity = function (req, res) {
    var communityId = req.params.communityId;
    if (!communityId) {
        return res.status(500).json({
            'err': 'communityId is necessary'
        });
    }
    var mongoQuery = {
        $and: []
    };
    mongoQuery.$and.push({
        communityId: communityId
    });
    mongoQuery.$and.push({
        status: 'active'
    });
    mongoQuery.$and.push({
        type: 'Note'
    });
    KContribution.find(mongoQuery, {
        '_id': 1,
        'data': 1,
        'authors': 1,
        'title':1
    }, function (err, allContributions) {
        if (err) {
            return handleError(res, err);
        }
        KAuthor.find({
            communityId: communityId,
            status: 'active'
        }, {
            communityId: 1,
            firstName: 1,
            lang: 1,
            lastName: 1,
            role: 1,
            status: 1,
            type: 1,
            userId: 1
        }, function (err, authors) {
            if (err) {
                return handleError(res, err);
            }
            var response = {
                authors: authors,
                contributions: allContributions
            }

            return res.status(200).json(response);
        });



    });
}



// Old Search function Delete after successful testing of New code -Karan Sheth
//-- #START -----
exports.searchCount_old = function(req, res) {
    makeMongoQuery(req, res, function() {
        KContribution.count(req.mongoQuery, function(err, count) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json({
                count: count
            });
        });
    });
};

exports.search_old = function(req, res) {
    //assure req.body.query
    if (!req.body.query) {
        console.error('search parameter error: ' + req.body);
        return res.sendStatus(400);
    }

    var query = req.body.query;

    var pagesize = query.pagesize ? query.pagesize : 50;
    pagesize = parseInt(pagesize);
    var page = query.page ? query.page : 1;
    var skip = pagesize * (page - 1);

    console.log("skip: ",skip);
    console.log("pagesize: ",pagesize);

    makeMongoQuery(req, res, function() {
        KContribution.find(req.mongoQuery).skip(0).
        limit(10).
        exec(function(err, contributions) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(contributions);
        });
    });
};

//-- #END -----


// ------------------------ New Search Function ------------------------


function mainSearchFilter(req, res) {

    var query = req.body.query;

    var projections = {
        "main_search":{ _id: 1,text4search:1},
        "annotation":{ _id: 1,'data.text':1},
        "notes":{ _id: 1,text4search:1},
    };

    var selectedProjection = projections.main_search;

    if(req.body.searchType !== undefined) {
        selectedProjection = projections[req.body.searchType.type];
    }

    if(req.body.searchType){
        switch (req.body.searchType.type) {
            case "annotation":
                req.mongoQuery.$and.push({type:'Annotation'});
                break;
            case "view":
                req.mongoQuery.$and.push({type:'View'});
                break;
            case "notes":
                req.mongoQuery.$and.push({type:{$in:['Note']}});
                break;
            default:
                req.mongoQuery.$and.push({type:{$in:['Note','View']}});
                break;
        }
    }

    KContribution.find(req.mongoQuery,selectedProjection, function(err, data) {
        if (err) {
            return handleError(res, err);
        }

        //-------- filtering out Data -------------------------
        var filterdObjects = null;
        if(query.words.length <= 0){
            filterdObjects = data;
        }
        else {
            filterdObjects = data.filter(function (d) {
                //---- Internal Process for filtering --------------
                var flag = false; //Flag for Checking if given object contains provided words or not.
                var content= d.text4search;

                if(req.body.searchType.type === "annotation"){
                    if(d.data !== undefined){
                        content = d.data.text;
                    }
                }

                if (content !== undefined) {
                    // query.words.forEach(function (word) {
                    // if (d.text4search.includes(word)) { //Case Sensitive bt Partial Match
                    // if (d.text4search.toLowerCase().indexOf(word) !== -1) { //Case Insensitive bt Perfect Match
                    if (content.toLowerCase().includes(query.words.toLowerCase())) {
                        flag = true;
                    }
                    else {
                        //flag = false;
                    }
                }

                return flag;
                //---- END- Internal Process for filtering --------------
            });
        }

        var filteredObjectIDs = [];
        filterdObjects.forEach(function(d){ filteredObjectIDs.push(d._id)});

        return res.status(200).json({
            filteredObjectIDs: filteredObjectIDs
        });
    });
}

exports.searchCount= function(req, res) {

    req.SearchV2 = true;
    makeMongoQuery(req, res, function() {
        //--- Separation Here.
        mainSearchFilter(req, res);
    });
};

exports.search = function(req, res) {
    var query = req.body.query;
    if(query.SearchV2 === true){
        req.SearchV2 = true;
    }
    if (!req.body.query) {
        console.error('search parameter error: ' + req.body);
        return res.sendStatus(400);
    }
    else if(req.body.query.rangeOfID !== undefined){

        KContribution.find({_id: {$in: query.rangeOfID}}, function(err, data) {
            if (err) {
                return handleError(res, err);
            }
            return res.status(200).json(data);
        });
    }
    else {
        var pagesize = query.pagesize ? query.pagesize : 50;
        pagesize = parseInt(pagesize);
        var page = query.page ? query.page : 1;
        var skip = pagesize * (page - 1);

        makeMongoQuery(req, res, function () {
            KContribution.find(req.mongoQuery).skip(0).limit(pagesize).exec(function (err, contributions) {
                if (err) {
                    return handleError(res, err);
                }
                return res.status(200).json(contributions);
            });
        });
    }
};



function makeMongoQuery(req, res, success) {
    var query = req.body.query;
    //assure communityId
    if (!query.communityId) {
        if (!req.author) {
            console.error('search query error: ' + query);
            return res.sendStatus(400);
        } else {
            query.communityId = req.author.communityId;
        }
    }


    if (query.scaffold && !query.viewIds ) {
        KLink.find({ communityId: query.communityId, type: 'supports' } , function (err, links) {
            if (err) {
                return handleError(res, err);
            }
            var ids = [];
            links.forEach(function (eachlink) {
                // console.log(query.scaffold.includes( eachlink._from.title.replace(/\s+/g, '')));
                if (query.scaffold.includes(eachlink._from.title.replace(/\s+/g, '')) && eachlink._to.status === 'active') {
                    ids.push(eachlink.to);
                }
            });
            req.scafoldids = ids;
            makeMongoQuery0(req, res, success);
        });

    }else if (query.viewIds && !query.scaffold ) {
        KLink.find({
            from: {
                $in: query.viewIds
            }
        }, function(err, links) {
            if (err) {
                return handleError(res, err);
            }
            var ids = [];
            links.forEach(function(each) {
                if (each._from.status === 'active') {
                    ids.push(each.to);
                }
            });
            req.ids = ids;
            makeMongoQuery0(req, res, success);
        });
    }
    else if (query.viewIds && query.scaffold){
        KLink.find({
            from: {
                $in: query.viewIds
            }
        }, function(err, links) {
            if (err) {
                return handleError(res, err);
            }
            var viewids = [];
            links.forEach(function(each) {
                if (each._from.status === 'active') {
                    viewids.push(each.to);
                }
            });
            req.ids = viewids;
            KLink.find({ communityId: query.communityId, type: 'supports' } , function (err, links) {
                if (err) {
                    return handleError(res, err);
                }
                var ids = [];

                links.forEach(function (eachlink) {
                    var scaffoldInView=viewids.some(function(id){
                        return id.equals(eachlink.to);
                    })
                    if (query.scaffold.includes(eachlink._from.title.replace(/\s+/g, '')) && eachlink._to.status === 'active' && scaffoldInView  ) {

                        ids.push(eachlink.to);
                    }
                });
                req.scafoldids = ids;
                makeMongoQuery0(req, res, success);
            });
        });
    }else{
        makeMongoQuery0(req, res, success);
    }
}

function makeMongoQuery0(req, res, success) {
    var query = req.body.query;
    var communityId = query.communityId;
    if (!communityId) {
        return res.status(500).json({
            'err': 'communityId is necessary'
        });
    }

    var mongoQuery = {
        $and: []
    };
    mongoQuery.$and.push({
        communityId: communityId
    });

    mongoQuery.$and.push({
        status: 'active'
    });

    if(query.search !== undefined && query.search === 'studentProfile'){
        mongoQuery.$and.push({
            authors: {
                $in: [mongoose.Types.ObjectId(query.privateMode[0])]
            }
        });
    }
    else{
        if (!query.privateMode) {
            mongoQuery.$and.push({
                permission: {
                    $in: ['public', 'protected']
                }
            });
        } else { //private mode
            mongoQuery.$and.push({
                authors: mongoose.Types.ObjectId(req.author._id)
            });
        }
    }

    if (req.scafoldids) {
        mongoQuery.$and.push({
            _id: {
                $in: req.scafoldids
            }
        });
    }
    if (req.ids) {
        mongoQuery.$and.push({
            _id: {
                $in: req.ids
            }
        });
    }
    if (query.ids) {
        mongoQuery.$and.push({
            _id: {
                $in: query.ids
            }
        });
    }

    if (query.authors && query.authors.length > 0) {
        var authorIds = [];
        query.authors.forEach(function(authorIdStr) {
            authorIds.push(mongoose.Types.ObjectId(authorIdStr));
        });
        mongoQuery.$and.push({
            authors: {
                $in: authorIds
            }
        });
    }

    if (query.from !== undefined) {
        var dateFrom = new Date(query.from);
        mongoQuery.$and.push({
            created: {
                $gte: dateFrom
            }
        });
    }

    if (query.to !== undefined) {
        var dateTo = new Date(query.to);
        mongoQuery.$and.push({
            created: {
                $lte: dateTo
            }
        });
    }

    //http://stackoverflow.com/questions/10913568/mongoose-how-to-find-3-words-in-any-order-and-in-any-place-in-the-string-sql
    //(?=.*comp)(?=.*abc)(?=.*300).*
    var regexpstr = '';
    if (req.SearchV2 !== true && query.words) {
        query.words.forEach(function(word) {
            regexpstr += '(?=.*' + word + ')';
        });
        regexpstr += '.*';
    }
    if (query.searchMode && query.searchMode === 'title') {
        mongoQuery.$and.push({
            title: new RegExp(regexpstr, 'i')
        });
    }
    else if(req.SearchV2 !== true) {
        mongoQuery.$and.push({
            text4search: new RegExp(regexpstr, 'i')
        });
    }

    if (query.type) {
        mongoQuery.$and.push({
            type: query.type
        });
    }
    req.mongoQuery = mongoQuery;
    success();
}

// not used yet
// exports.textindexSearch = function(req, res) {
//     var text = req.body.searchText;
//     Contribution.find({
//             $text: {
//                 $search: text
//             }
//         }
//         // , {
//         //         score: {
//         //             $meta: 'textScore'
//         //         },
//         //         title: 1,
//         //         body: 1,
//         //         type: 1
//         //     }).
//         //     sort({
//         //         score: {
//         //             $meta: 'textScore'
//         //         }
//         //     }
//     ).
//     limit(10).
//     exec(function(err, posts) {
//         if (err) {
//             return handleError(res, err);
//         }
//         return res.json(200, posts);
//     });
// };

// this method is painful
exports.createBuildsOn = function(req, res, note, buildsonId, handler) {
    var seed = {
        communityId: note.communityId,
        from: note._id,
        to: buildsonId,
        type: 'buildson'
    };
    KLinkController.checkAndCreate(req, seed, function(err, link) {
        if (err) {
            if (handler) {
                handler(err);
            }
            return;
        }
        KLink.find({
                to: link.to,
                type: 'contains'
            },
            function(err, refs) {
                if (err) {
                    console.error(err);
                    return;
                }
                refs.forEach(function(ref) {
                    // Find free space for buildson note in every view
                    KLink.find(
                        {
                            from: ref.from,
                            type: 'contains',
                            "_to.status": 'active'
                        },
                        function(err, elements) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            var position = {
                                x: ref.data.x + 50,
                                y: ref.data.y + 50
                            };
                            position = KLinkController.getNewElementPosition(elements, position);
                            var newref = {
                                from: ref.from,
                                to: link.from,
                                type: 'contains',
                                data: position
                            };
                            KLinkController.checkAndCreate(req, newref, function(err, newref) {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                        }
                    );
                });
            });
        if (handler) {
            handler(err, link);
        }
        return;
    });
};

function handleError(res, err) {
    console.error(err);
    return res.send(500, err);
}
