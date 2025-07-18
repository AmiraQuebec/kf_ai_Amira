'use strict';

angular.module('kf6App')
    .factory('$suresh', function ($community, $ac, $http, $kftag) {
        var obj = {};
        var toConnections = [];
        var fromConnections = [];
        var xpos=100, ypos=100;
        //  var communityId = $community.getCommunityData().community._id;

        obj.searchprocess = function (queryString, communityId, communityMembers, $community, status, getContributions) {
            var pager = {};
            pager.pagesize = 50000;
            pager.query = makeQuery(queryString, communityId, communityMembers, $community);
            count(status, pager, communityId, getContributions);
        };

        var makeQuery = function (queryString, communityId, communityMembers, $community) {
            var query = {
                communityId: communityId,
                words: [],
                authors: []
            };
            var tokens = queryString.split(' ');
            tokens.forEach(function (token) {
                if (token.length === 0) {
                    return;
                }

                if (token.indexOf('-private') >= 0) {
                    query.privateMode = $community.getAuthor()._id;
                    return;
                }

                if (token.indexOf('-view:') >= 0) {
                    token = token.replace('-view:', '');
                    if (!query.viewIds) {
                        query.viewIds = [];
                    }
                    query.viewIds.push(token);
                    return;
                }
                if (token.indexOf('-from:') >= 0) {
                    token = token.replace('-from:', '');
                    query.from = token;
                    return;
                }
                if (token.indexOf('-to:') >= 0) {
                    token = token.replace('-to:', '');
                    query.to = token;
                    return;
                }
                if (token.indexOf('-author:') >= 0) {
                    token = token.replace('-author:', '');
                    var author = _.find(communityMembers, {
                        userName: token
                    });
                    if (author) {
                        query.authors.push(author._id);
                    } else {
                        window.alert('author:' + token + ' not found');
                    }
                    return;
                }
                if (token.indexOf('-searchMode:') >= 0) {
                    token = token.replace('-searchMode:', '');
                    query.searchMode = token;
                    return;
                }
                if (token.indexOf('-type:') >= 0) {
                    token = token.replace('-type:', '');
                    query.type = token;
                    return;
                }
                query.words.push(token);
            });
            return query;
        };

        var count = function (status, pager, communityId, getContributions) {
            status.status = 'searching';
            $http.post('/api/contributions/' + communityId + '/search/count', {
                query: pager.query
            }).success(function (result) {
                pager.total = result.count;
                pager.page = 1;
                openPage(status, pager, communityId, getContributions);
            }).error(function () {
                status.status = 'error';
            });
        };

        function openPage(status, pager, communityId, getContributions) {
            status.status = 'searching';
            pager.query.pagesize = pager.pagesize;
            pager.query.page = pager.page;
            $http.post('/api/contributions/' + communityId + '/search', {
                query: pager.query
            }).success(function (contributions) {
                contributions.forEach(function (c) {
                    if (!$ac.isReadable(c)) {
                        c.title = 'forbidden';
                        c.authors = [];
                        c.data.body = '(forbidden)';
                        c.created = null;
                    }
                });
                if (contributions.length > 0) {
                    status.status = 'searched';
                } else {
                    status.status = 'noresult';
                }
                getContributions(contributions);
            }).error(function () {
                status.status = 'error';
            });
        }

        obj.getIcon = function (contribution, $community) {
            if ($community.amIAuthor(contribution)) {
                return 'manual_assets/kf4images/icon-note-unknown-auth-.gif';
            } else {
                return 'manual_assets/kf4images/icon-note-unknown-othr-.gif';
            }
        };

        obj.createnewnoteInMutipleView = function (title, viewIds, $community, body, hasPromisingIdeas) {
            viewIds.forEach(function (viewId) {
                obj.createnewnote(title, viewId, $community, body, hasPromisingIdeas);
            });
        };

        obj.setCordinate = function(x,y){
             xpos=x;
             ypos =y;
        };

        obj.createnewnote = function (title, viewId, $community, body, hasPromisingIdeas) {
            $community.createNote(null, function (note) {
                createContainsLink(viewId, note._id, $community, {
                    x: xpos,
                    y: ypos
                });
                postProcess(note._id, body, function (jq) {
                    if (!note.data) {
                        note.data = {};
                    }
                    if (hasPromisingIdeas) {
                        var promisingContains = {};
                        note.data.promisingContains = promisingContains;
                    }
                    note.data.body = jq.html();
                    note.title = title;
                    note.status = 'active';
                    note.text4search = '( ' + note.title + ' ) ' + jq.text();
                    $community.modifyObject(note, function (note) {
                        $community.read(note);
                    }, function () {
                        if (window.localStorage) {
                            window.localStorage.setItem('kfdoc', note.data.body);
                        }
                    });

                });

            });
        };

        var postProcess = function (contributionId, text, handler) {
            updateToConnections(contributionId, function () {
                updateFromConnections(contributionId, function () {
                    $kftag.postProcess(text, contributionId, toConnections, fromConnections,
                        function (jq) {
                            handler(jq);
                        });
                });
            });
        };

        var updateToConnections = function (contributionId, next) {
            $http.get('/api/links/to/' + contributionId).success(function (links) {
                toConnections = links;
                if (next) {
                    next();
                }
            });
        };

        var updateFromConnections = function (contributionId, next) {
            $http.get('/api/links/from/' + contributionId).success(function (links) {
                fromConnections = links;
                if (next) {
                    next(links);
                }
            });
        };

        function createContainsLink(viewId, toId, $community, data, handler) {
            $community.createLink(viewId, toId, 'contains', data, handler);
        }

        obj.detailsControl = function (status) {
            status.detailsCollapsed = false;
            if (!status.radarchartCollapsed) {
                status.radarchartCollapsed = true;
            }
            if (!status.barchartCollapsed) {
                status.barchartCollapsed = true;
            }
        };

        obj.radarchartControl = function (status) {
            status.radarchartCollapsed = !status.radarchartCollapsed;
            if (!status.detailsCollapsed) {
                status.detailsCollapsed = true;
            }
            if (!status.barchartCollapsed) {
                status.barchartCollapsed = true;
            }
        };

        obj.barchartControl = function (status) {
            status.barchartCollapsed = !status.barchartCollapsed;
            if (!status.radarchartCollapsed) {
                status.radarchartCollapsed = true;
            }
            if (!status.detailsCollapsed) {
                status.detailsCollapsed = true;
            }
        };

        obj.promisingcolors = function () {
            var colors = [
        '',
        'yellow',
        'red',
        'blue',
        'green',
        'pink',
        'violet',
        'purple',
        'orange'
      ];
            return colors;
        };


        obj.createPromisngIdeaobj = function ($community, promisingIdeaobj, id, handler) {
            var communityId = $community.getCommunityData().community._id;
            var newobj = {
                communityId: communityId,
                type: 'promisingIdeaobj',
                title: 'an promisingIdeaobj',
                authors: $community.getAuthor()._id,
                created: new Date(),
                status: 'active',
                permission: 'protected',
                data: promisingIdeaobj
            };
            $http.post('/api/contributions/' + communityId, newobj)
                .success(function (promisingIdeaobj_) {
                    createpromisingIdeaobjLink(promisingIdeaobj_, id, handler);
                });
        };

        var createpromisingIdeaobjLink = function (promisingIdeaobj, id, handler) {
            var link = {};
            link.to = id;
            link.from = promisingIdeaobj._id;
            link.type = 'promisings';
            link.data = promisingIdeaobj.data;
            $http.post('/api/links', link).success(function (link) {
                handler(link, promisingIdeaobj);
            });
        };

        obj.promisingIdeaobjUpdated = function (promisingIdeaobjLink, $community, promisingIdeaobjs) {
            if (!promisingIdeaobjLink.to || !promisingIdeaobjLink.from) {
                console.error('ERROR! promisingIdeaobj doesn\'t have id on update');
                return;
            }
            var model = promisingIdeaobjs[promisingIdeaobjLink.from];
            if (!model) {
                console.error('ERROR! model couldn\'t find');
                return;
            }
            $community.modifyObject(model);
        };

        obj.promisingIdeaobjDeleted = function (promisingIdeaobjLink) {
            if (!promisingIdeaobjLink.to || !promisingIdeaobjLink.from) {
                console.error('ERROR! promisingIdeaobj doesn\'t have id on delete');
                return;
            }
            $http.delete('/api/links/' + promisingIdeaobjLink._id);
        };


        return obj;
    });
