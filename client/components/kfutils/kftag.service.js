'use strict';

angular.module('kf6App')
    .factory('$kftag', function($community, $http) {
        var obj = {};

        obj.createNewReferenceTag = function(contId, title, authors, text) {
            var tag = '';
            tag = tag + '<span class="mceNonEditable KFReference" id="' + contId + '">';
            tag = tag + obj.createReferenceTag(contId, title, authors, text);
            tag = tag + '</span>';
            return tag;
        };

        obj.createReferenceTag = function(contId, title, authors, text) {
            var authorText = $community.makeAuthorStringByIds(authors);
            var tag = '';
            if (text && text.length > 0) {
                tag = tag + '<span class="KFReferenceQuote"><span>"</span><span class="KFReferenceText">' + text + '</span><span>"</span></span>';
            }
            tag = tag + '<span> (<a href="contribution/' + contId + '" target="' + contId + '">';
            tag = tag + '<img src="/manual_assets/kf4images/icon-note-unread-othr-.gif">"' + title + '"</a>';
            tag = tag + '<span class="KFReferenceAuthor"> by ' + authorText + '</span>)</span>';
            tag = tag + '</span>';
            return tag;
        };

        obj.createNewScaffoldTag = function(supportId, title, text, isTemplate) {
            var tag = '';
            tag = tag + '<br>';
            tag = tag + '&nbsp;&nbsp;'; //important for mce
            if (!isTemplate) {
                tag = tag + '<span id="' + supportId + '" class="KFSupportStart mceNonEditable">';
            } else {
                tag = tag + '<span id="' + supportId + '" class="KFSupportStart KFTemplateStart mceNonEditable">';
            }
            tag = tag + obj.createScaffoldStartTag(title, isTemplate);
            tag = tag + '</span>';
            if (isTemplate) {
                tag = tag + '<p class="kfTemplateContent">';
                tag = tag + '<br><br><br><br>';
            }
            tag = tag + text;
            if (isTemplate) {
                tag = tag + '</p>';
            }
            if (!isTemplate) {
                tag = tag + '<span id="' + supportId + '" class="KFSupportEnd mceNonEditable">';
            } else {
                tag = tag + '<span id="' + supportId + '" class="KFSupportEnd KFTemplateEnd mceNonEditable">';
            }
            tag = tag + obj.createScaffoldEndTag(isTemplate);
            tag = tag + '</span>';
            tag = tag + '&nbsp;&nbsp;'; //important for mce
            tag = tag + '<br>';
            return tag;
        };

        obj.createScaffoldStartTag = function(title, isTemplate) {
            var tag = '';
            tag = tag + ' '; //important for mce
            if (!isTemplate) {
                tag = tag + '<span class="kfSupportStartMark"> &nbsp; </span>';
            } else {
                tag = tag + '<span class="kfSupportStartMark kfTemplateStartMark"> &nbsp; </span>';
            }
            tag = tag + ' '; //important for mce
            if (!isTemplate) {
                tag = tag + '<span class="kfSupportStartLabel">' + title + '</span>';
            } else {
                tag = tag + '<span class="kfSupportStartLabel kfTemplateStartLabel">' + title + '</span>';
            }
            tag = tag + ' '; //important for mce
            return tag;
        };

        obj.createScaffoldEndTag = function(isTemplate) {
            var tag = '';
            tag = tag + ' '; //important for mce
            if (!isTemplate) {
                tag = tag + '<span class="kfSupportEndMark"> &nbsp; </span>';
            } else {
                tag = tag + '<span class="kfSupportEndMark kfTemplateEndMark"> &nbsp; </span>';
            }
            tag = tag + ' '; //important for mce
            return tag;
        };

        obj.preProcess = function(body, toConnections, fromConnections) {
            var doc = '<div>' + body + '</div>';
            var jq = $(doc);

            jq.find('.KFSupportStart').addClass('mceNonEditable');
            elemLoop(jq.find('.KFSupportStart'), function(elem) {
                if (elem.id.startsWith('supportid_')) {
                    return; //do nothing
                }
                var isTemplate = $(elem).hasClass('KFTemplateStart');
                var ref = _.find(toConnections, function(conn) {
                    return conn._id === elem.id;
                });
                if (ref) {
                    elem.innerHTML = obj.createScaffoldStartTag(ref._from.title, isTemplate);
                } else {
                    if(toConnections !== 'Annotation'){
                        elem.innerHTML = obj.createScaffoldStartTag('(missing link)', isTemplate);
                    }
                }
            });

            jq.find('.KFSupportEnd').addClass('mceNonEditable');
            elemLoop(jq.find('.KFSupportEnd'), function(elem) {
                var isTemplate = $(elem).hasClass('KFTemplateEnd');
                elem.innerHTML = obj.createScaffoldEndTag(isTemplate);
            });

            jq.find('.KFReference').addClass('mceNonEditable');
            elemLoop(jq.find('.KFReference'), function(elem) {
                var ref = _.find(fromConnections, function(conn) {
                    return conn._id === elem.id;
                });
                if (ref) {
                    var text = '';
                    if (ref.data) {
                        text = ref.data.text;
                    }
                    elem.innerHTML = obj.createReferenceTag(ref.to, ref._to.title, ref._to.authors, text);
                } else {
                    elem.innerHTML = obj.createReferenceTag('', '(lien manquant', '', '');
                }
            });
            return jq.html();
        };

        obj.postProcess = function(text, contributionId, toConnections, fromConnections, handler) {
            var doc = '<div>' + text + '</div>';
            var jq = $(doc);
            var todos = [];
            var endtags = {};
            var supportLinks = getLinks(toConnections, 'supports');
            var dSupportLinks = getLinks(toConnections, 'supports'); //TODO we need two to support duplication the algorithm problem

            elemLoop(jq.find('.KFSupportStart'), function(elem) {
                elem.innerHTML = '';
                var supportId = elem.id;
                if (supportId.startsWith('supportid_')) {
                    supportId = supportId.split('_')[1];
                }
                processOneElement(todos, elem, supportLinks, dSupportLinks, 'supports', supportId, contributionId, endtags, {});
            });

            elemLoop(jq.find('.KFSupportEnd'), function(elem) {
                elem.innerHTML = '';
                var id = elem.id;
                endtags[id] = elem;
            });

            deleteLinks(todos, _.map(dSupportLinks));

            var referenceLinks = getLinks(fromConnections, 'references');
            var dReferenceLinks = getLinks(fromConnections, 'references');

            elemLoop(jq.find('.KFReference'), function(elem) {
                var data = {};
                data.text = $(elem).find('.KFReferenceText').html();
                elem.innerHTML = '';
                processOneElement(todos, elem, referenceLinks, dReferenceLinks, 'references', contributionId, elem.id, {}, data);
            });

            deleteLinks(todos, _.map(dReferenceLinks));

            processTodo(todos, handler, jq);
        };

        obj.processTemplate = function(text, toConnections) {
            var supportLinks = getLinks(toConnections, 'supports');
            var doc = '<div>' + text + '</div>';
            var jq = $(doc);

            var endtags = {};
            elemLoop(jq.find('.KFSupportEnd'), function(elem) {
                endtags[elem.id] = elem;
            });

            elemLoop(jq.find('.KFSupportStart'), function(elem) {
                var link = supportLinks[elem.id];
                var endtag = endtags[elem.id];
                if (!link) {
                    console.error('link not found.');
                    return;
                }
                elem.id = 'supportid_' + link.from;
                endtag.id = 'supportid_' + link.from;
            });
            return jq.html();
        };

        function processOneElement(todos, elem, links, links4delete, type, fromId, toId, endtags, data) {
            if (links[elem.id]) {
                delete links4delete[elem.id];
            } else {
                todos.push(function(handler) {
                    createLink(type, fromId, toId, data, function(link) {
                        if (!link) {
                            console.error('failure');
                            handler();
                            return;
                        }
                        var oldId = elem.id;
                        var newId = link._id;
                        elem.id = newId;
                        if (endtags[oldId]) {
                            endtags[oldId].id = newId;
                        }
                        handler();
                    });
                });
            }
        }

        function getLinks(sourceLinks, type) {
            var links = {};
            sourceLinks.forEach(function(each) {
                if (each.type === type) {
                    links[each._id] = each;
                }
            });
            return links;
        }

        function deleteLinks(todos, links) {
            links.forEach(function(each) {
                todos.push(function(handler) {
                    $http.delete('/api/links/' + each._id).success(function() {
                        handler();
                    }).error(function() {
                        handler();
                    });
                });
            });
        }

        function createLink(type, fromId, toId, data, handler) {
            var refObj = {};
            refObj.from = fromId;
            refObj.to = toId;
            refObj.type = type;
            refObj.data = data;
            $http.post('/api/links', refObj).success(function(ref) {
                handler(ref);
            }).error(function() {
                handler();
            });
        }

        function processTodo(todos, handler, jq) {
            var len = todos.length;
            var numFinished = 0;
            if (len <= 0) {
                handler(jq);
                return;
            }
            todos.forEach(function(func) {
                func(function() {
                    numFinished++;
                    if (numFinished >= len) {
                        handler(jq);
                    }
                });
            });
        }

        function elemLoop(jq, func) {
            var len = jq.size();
            for (var i = 0; i < len; i++) {
                var elem = jq.get(i);
                func(elem);
            }
        }

        return obj;
    });
