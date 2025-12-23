'use strict';

angular.module('kf6App')
    .controller('ContributionCtrl', function($scope, $rootScope, $http, $community, $kftag, $stateParams, $ac, $timeout, $kfutil, $translate, $sce, $suresh, $sureshshared, $compile, Auth, $upload, $filter,$q,$modal,$uibModal) {
        var contributionId = $stateParams.contributionId;
        var contextId = $stateParams.contextId;

        if (contributionId === undefined) {
            contributionId = $rootScope.contributionId;
        }
        if (contextId === undefined) {
            contextId = $rootScope.contextId;
        }

        $ac.mixIn($scope, null);
        $kfutil.mixIn($scope);

        $scope.status = {};
        $scope.status.error = false;
        $scope.status.isScaffoldCollapsed = false;
        $scope.status.isAttachmentsCollapsed = true;
        $scope.status.isContributionCollapsed = true;
        $scope.status.ispromisingideaCollapsed = true;
        $scope.status.ispromisingideaTabDisplayed = false;
        $scope.showpromisingideaColour = false;
        $scope.haspromisingidea = false;
        $scope.status.isInsertImgCollapsed = false;
        $scope.status.edittabActive = false;
        $scope.status.dirty = true;
        $scope.status.contribution = '';
        $scope.status.initializing = 'true';
        $scope.status.recoverable = false;

        $scope.promisingmsg = 'Afficher le texte en surbrillance';

        $scope.selectedIndex = -1;
        $scope.newnoteIndex = -1;
        $scope.deletedIndex = -1;

        $scope.status.insertable = false;
        $scope.status.googleOAuth = false;


        $scope.scaffolds = [];
        $scope.scaffoldCurrent = {};

        $scope.community = {};
        $scope.contribution = {};
        $scope.copy = {};
        $scope.authors = [];
        $scope.records = [];
        $scope.toConnections = [];
        $scope.fromConnections = [];
        $scope.communityMembers = [];
        $scope.images = [];
        $scope.selected = {};

        $scope.selectedText = '';
        $scope.obj = { targetColor: '', textareaText: '' };
        $scope.promisingIdeaobjs = {};
        $scope.promisingIdeaobjLinks = {};
        $scope.selectedViewIds = [];
        $scope.promisingnoteTitle = '';

        $scope.preContributeHooks = [];
        $scope.initializingHooks = [];
        $scope.initializingHookInvoked = false;
        $scope.colors =getPromisingcolours();
        $scope.promisingColorData=[];
        $scope.promisingIdeacolorobjsarr=[];

        $scope.popupGWindow = 0;

        $scope.isGoogleDoc = false;
        $scope.token = Auth.getToken();

        $scope.projects = [];
        $scope.threads = [];
        $scope.projectsObj = {};
        $scope.threadsObj = {};
        $scope.belongsToThreads = [];
        $scope.belongsToThreadsObj = {};
        $scope.scaffoldUpdated = false;
        var itmServer = $community.itmServer;

        $scope.itmEnabled = false;
        $scope.textContainer = {};
        var blankHTMLDoc = '<!DOCTYPE html>\n' + '<html>\n' + '<head>\n' +'</head>\n' + '<body>\n' + '\n' + '</body>\n' + '</html>';


        $scope.spellCheckDavinci = function(){

            var editorContent = tinymce.activeEditor.getContent();
            // change the #spell-check-text text to editorContent
            $('#spelling-modal').css('display','contents');
            $http.post('/api/ai/spellCheck?explain=davinci', {
                text: editorContent
            }).success(function(data, status, headers, config) {
                $('#spell-check-text').html(data);

            }).error(function(data, status, headers, config) {
                $('#spell-check-text').text(data);

            });

        }

        function replaceNewlinesWithBreaks(text) {
            if (text) {
                return text.replace(/\n/g, '<br>');
            }
            return text;
        }


        $scope.spellCheckGpt4 = function(modalId, event) {
            var button = event.target;
            var container = button.closest('div[id^="ctrb_window"]');

            if (!container) {
                console.error('Could not find the container div.');
                return;
            }

            var iframe = container.querySelector('iframe[id^="ui-tinymce-"][id$="_ifr"]');

            if (!iframe) {
                console.error('Could not find the TinyMCE iframe.');
                return;
            }

            var instanceNumber = iframe.id.replace('ui-tinymce-', '').replace('_ifr', '');
            var editor = tinymce.get('ui-tinymce-' + instanceNumber);

            if (editor) {
                var content = editor.getContent();
                console.log("Editor content:", content);

                var url = window.location.href;
                var segments = url.split('/');
                var viewId = segments.pop() || segments.pop();

                var $modal = $('#' + modalId);

                $modal.find('#mod-title').text('Suggestions');

                var height = $(window).height() * 0.9;
                $(".ui-dialog").css("height", height);
                $(".ui-dialog").css("inset", "13px auto auto 415px");
                $(".ui-dialog-content").css("height", height);

                var dialogBoxElement = document.getElementsByClassName('ui-dialog-content')[0];
                dialogBoxElement.scrollTop = 0;

                $('.btn-spell-checker').prop('disabled', true);
                $timeout(function() {
                    $('.btn-spell-checker').prop('disabled', false);
                }, 40000);

                var params = {
                    "community_id": $scope.community.community._id,
                    "kf_user_id": $scope.community.author.userId,
                    "viewId" : viewId,
                    "token": $scope.token,
                    "contribution_id": $scope.contribution._id
                };

                $modal.find('#spell-check-text').html("Un instant S.V.P");
                $modal.find('.loading-ai').css('display', 'initial');
                $('#' + modalId).css('display', 'contents');

                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/ai/spellCheck?spell=gpt4', true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                var accumulatedData = '';

                xhr.onprogress = function () {
                    var chunk = xhr.responseText.slice(accumulatedData.length);
                    accumulatedData += chunk;
                    console.log('Received chunk:', chunk);
                    console.log('Accumulated data:', accumulatedData);
                    try {
                        // Regex pour le format standard
                        var regexStandard = /(\{.*?\})(?=\{|\s*$)/g;
                        // Regex pour le format spellcheck
                        var regexSpellcheck = /(\{.*?\})(?=\{|\n|$)/g;
                        var regex = regexStandard; // Par défaut, on utilise le regex standard

                        // Détection du format des données
                        if (accumulatedData.includes('"partial"')) {
                            regex = regexSpellcheck;
                        }

                        var match;
                        while ((match = regex.exec(accumulatedData)) !== null) {
                            var jsonString = match[0];
                            console.log('JSON string:', jsonString);
                            var parsedChunk = JSON.parse(jsonString);
                            if (parsedChunk.partial) {
                                console.log('Parsed partial:', parsedChunk.partial);
                                $scope.$apply(function () {
                                    $modal.find('.loading-ai').css('display', 'none');
                                    $modal.find('#spell-check-text').append(replaceNewlinesWithBreaks2(parsedChunk.partial));
                                });
                            } else if (parsedChunk.partial) {
                                // Traitement pour les données non-spellcheck
                                console.log('Parsed partial:', parsedChunk.partial);
                                $scope.$apply(function () {
                                    $modal.find('.loading-ai').css('display', 'none');
                                    $modal.find('#spell-check-text').html(replaceNewlinesWithBreaks2(parsedChunk.partial));
                                });
                            }
                        }
                        accumulatedData = accumulatedData.slice(regex.lastIndex);
                    } catch (e) {
                        console.error("Error parsing chunk:", e);
                    }
                };

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        $scope.$apply(function () {
                            $modal.find('.loading-ai').css('display', 'none');
                        });
                        console.log("Stream complete");
                    } else {
                        $scope.$apply(function () {
                            $modal.find('#spell-check-text').text("Une erreur s'est produite: " + xhr.status);
                            $modal.find('.loading-ai').css('display', 'none');
                        });
                        console.error("Une erreur s'est produite:", xhr.statusText);
                    }
                };

                xhr.onerror = function () {
                    $scope.$apply(function () {
                        $modal.find('#spell-check-text').text("Une erreur réseau s'est produite");
                        $modal.find('.loading-ai').css('display', 'none');
                    });
                    console.error("Une erreur réseau s'est produite");
                };

                xhr.send(JSON.stringify({
                    text: content,
                    params: params
                }));
            } else {
                console.error('Could not find the correct editor.');
            }
        };


        $(document).ready(function () {
            function makeElementDraggable(el) {
                var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                const header = el.querySelector(".modal-header");
                if (header) {
                    header.onmousedown = dragMouseDown;
                } else {
                    el.onmousedown = dragMouseDown;
                }

                function dragMouseDown(e) {
                    e.preventDefault();
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    document.onmouseup = closeDragElement;
                    document.onmousemove = elementDrag;
                }

                function elementDrag(e) {
                    e.preventDefault();
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    el.style.top = (el.offsetTop - pos2) + "px";
                    el.style.left = (el.offsetLeft - pos1) + "px";
                }

                function closeDragElement() {
                    document.onmouseup = null;
                    document.onmousemove = null;
                }
            }

            function makeElementResizable(el) {
                const resizer = document.createElement('div');
                resizer.className = 'resizable-handle';
                el.appendChild(resizer);
                resizer.addEventListener('mousedown', initResize, false);

                function initResize(e) {
                    window.addEventListener('mousemove', resize, false);
                    window.addEventListener('mouseup', stopResize, false);
                }

                function resize(e) {
                    el.style.width = (e.clientX - el.offsetLeft) + 'px';
                    el.style.height = (e.clientY - el.offsetTop) + 'px';
                }

                function stopResize() {
                    window.removeEventListener('mousemove', resize, false);
                    window.removeEventListener('mouseup', stopResize, false);
                }
            }

            $('#spellCheckModal').on('shown.bs.modal', function () {
                const modalDialog = document.querySelector('#spellCheckModal .modal-dialog');
                makeElementDraggable(modalDialog);
                makeElementResizable(modalDialog);
            });

            setInterval(renderSpellCheckText, 5000);
        });


        function renderSpellCheckText() {
            var spellCheckTextDiv = document.getElementById('spell-check-text');
            if (spellCheckTextDiv) {
                // Temporarily store the content
                var content = spellCheckTextDiv.innerHTML;

                // Clear the existing content
                spellCheckTextDiv.innerHTML = '';

                // Recreate the content and set it back
                spellCheckTextDiv.innerHTML = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                console.log('Rendered content:', spellCheckTextDiv.innerHTML);
            }
            // Error message removed - silently handle when div is not found
        }




        $scope.spellCheckFull = function(modalId, event) {
            var loadingAiDiv = document.querySelector('.loading-ai');

            loadingAiDiv.style.display = 'flex';

            var button = event.target;
            var container = button.closest('div[id^="ctrb_window"]');

            if (!container) {
                console.error('Could not find the container div.');
                return;
            }

            var iframe = container.querySelector('iframe[id^="ui-tinymce-"][id$="_ifr"]');

            if (!iframe) {
                console.error('Could not find the TinyMCE iframe.');
                return;
            }

            var instanceNumber = iframe.id.replace('ui-tinymce-', '').replace('_ifr', '');
            var editor = tinymce.get('ui-tinymce-' + instanceNumber);

            if (editor) {
                var content = editor.getContent();
                console.log("Editor content:", content);

                var floatingPanel = document.getElementById('floatingPanel');
                var spellCheckTextDiv = document.getElementById('spell-check-text');
                spellCheckTextDiv.innerHTML = "Un instant S.V.P";  // Initialize panel content

                // Show the floating panel
                floatingPanel.style.display = 'block';

                // Make the panel draggable
                makeDraggable(floatingPanel);

                var params = {
                    "community_id": $scope.community.community._id,
                    "kf_user_id": $scope.community.author.userId,
                    "token": $scope.token,
                    "contribution_id": $scope.contribution._id
                };

                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/ai/spellCheck?spell=full', true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                var accumulatedData = '';

                xhr.onprogress = function () {
                    var chunk = xhr.responseText.slice(accumulatedData.length);
                    accumulatedData += chunk;
                    console.log('Received chunk:', chunk);
                    console.log('Accumulated data:', accumulatedData);

                    // Regex for standard format
                    var regexStandard = /(\{.*?\})(?=\{|\s*$)/g;
                    // Regex for spellcheck format
                    var regexSpellcheck = /(\{.*?\})(?=\{|\n|$)/g;
                    var regex = regexStandard; // Default to standard regex

                    // Detect data format
                    if (accumulatedData.includes('"partial"')) {
                        regex = regexSpellcheck;
                        $scope.$apply(function () {
                            var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
                            if (loadingAiDiv) {
                                loadingAiDiv.style.display = 'none';
                            }
                            spellCheckTextDiv.innerHTML = "";
                        });
                    }

                    var match;
                    while ((match = regex.exec(accumulatedData)) !== null) {
                        var jsonString = match[0];
                        console.log('JSON string:', jsonString);
                        var parsedChunk = JSON.parse(jsonString);
                        if (parsedChunk.partial) {
                            console.log('Parsed partial:', parsedChunk.partial);
                            $scope.$apply(function () {
                                var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
                                if (loadingAiDiv) {
                                    loadingAiDiv.style.display = 'none';
                                }
                                spellCheckTextDiv.innerHTML += replaceNewlinesWithBreaks(parsedChunk.partial);  // Append new content
                            });
                        }
                    }
                    accumulatedData = accumulatedData.slice(regex.lastIndex);
                };

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        console.log("Stream complete");
                    } else {
                        console.error("Une erreur s'est produite:", xhr.statusText);
                    }
                };

                xhr.onerror = function () {
                    console.error("Une erreur réseau s'est produite");
                };

                xhr.send(JSON.stringify({
                    text: content,
                    params: params
                }));
            } else {
                console.error('Could not find the correct editor.');
            }
        };







        $scope.spellCheckQuick = function(modalId, event) {
            var loadingAiDiv = document.querySelector('.loading-ai');

            loadingAiDiv.style.display = 'flex';

            var button = event.target;
            var container = button.closest('div[id^="ctrb_window"]');

            if (!container) {
                console.error('Could not find the container div.');
                return;
            }

            var iframe = container.querySelector('iframe[id^="ui-tinymce-"][id$="_ifr"]');

            if (!iframe) {
                console.error('Could not find the TinyMCE iframe.');
                return;
            }

            var instanceNumber = iframe.id.replace('ui-tinymce-', '').replace('_ifr', '');
            var editor = tinymce.get('ui-tinymce-' + instanceNumber);

            if (editor) {
                var content = editor.getContent();
                console.log("Editor content:", content);

                var floatingPanel = document.getElementById('floatingPanel');
                var spellCheckTextDiv = document.getElementById('spell-check-text');
                spellCheckTextDiv.innerHTML = "Un instant S.V.P";  // Initialize panel content

                // Show the floating panel
                floatingPanel.style.display = 'block';

                // Make the panel draggable
                makeDraggable(floatingPanel);

                var params = {
                    "community_id": $scope.community.community._id,
                    "kf_user_id": $scope.community.author.userId,
                    "token": $scope.token,
                    "contribution_id": $scope.contribution._id
                };

                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/ai/spellCheck?spell=quick', true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                var accumulatedData = '';

                xhr.onprogress = function () {
                    var chunk = xhr.responseText.slice(accumulatedData.length);
                    accumulatedData += chunk;
                    console.log('Received chunk:', chunk);
                    console.log('Accumulated data:', accumulatedData);

                    // Regex for standard format
                    var regexStandard = /(\{.*?\})(?=\{|\s*$)/g;
                    // Regex for spellcheck format
                    var regexSpellcheck = /(\{.*?\})(?=\{|\n|$)/g;
                    var regex = regexStandard; // Default to standard regex

                    // Detect data format
                    if (accumulatedData.includes('"partial"')) {
                        regex = regexSpellcheck;
                        $scope.$apply(function () {
                            var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
                            if (loadingAiDiv) {
                                loadingAiDiv.style.display = 'none';
                            }
                            spellCheckTextDiv.innerHTML = "";
                        });
                    }

                    var match;
                    while ((match = regex.exec(accumulatedData)) !== null) {
                        var jsonString = match[0];
                        console.log('JSON string:', jsonString);
                        var parsedChunk = JSON.parse(jsonString);
                        if (parsedChunk.partial) {
                            console.log('Parsed partial:', parsedChunk.partial);
                            $scope.$apply(function () {
                                var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
                                if (loadingAiDiv) {
                                    loadingAiDiv.style.display = 'none';
                                }
                                spellCheckTextDiv.innerHTML += replaceNewlinesWithBreaks(parsedChunk.partial);  // Append new content
                            });
                        }
                    }
                    accumulatedData = accumulatedData.slice(regex.lastIndex);
                };

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        console.log("Stream complete");
                    } else {
                        console.error("Une erreur s'est produite:", xhr.statusText);
                    }
                };

                xhr.onerror = function () {
                    console.error("Une erreur réseau s'est produite");
                };

                xhr.send(JSON.stringify({
                    text: content,
                    params: params
                }));
            } else {
                console.error('Could not find the correct editor.');
            }
        };

        function makeDraggable(element) {
            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            if (document.querySelector(".panel-header")) {
                // if present, the header is where you move the DIV from:
                document.querySelector(".panel-header").onmousedown = dragMouseDown;
            } else {
                // otherwise, move the DIV from anywhere inside the DIV:
                element.onmousedown = dragMouseDown;
            }

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                // get the mouse cursor position at startup:
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                // call a function whenever the cursor moves:
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                // stop moving when mouse button is released:
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }



        function replaceNewlinesWithBreaks2(text) {
            // Remplacer les nouvelles lignes par des balises <br>
            text = text.replace(/\n/g, '<br>');

            // Échapper les guillemets dans les styles de balises HTML
            text = text.replace(/style="(.*?)"/g, function(match, p1) {
                return 'style="' + p1.replace(/"/g, '&quot;') + '"';
            });

            return text;
        }








        $scope.spellCheckTurboExplain = function(modalId, event, lv) {

            var loadingAiDiv = document.querySelector('.loading-ai');
            loadingAiDiv.style.display = 'flex';

            function makeDraggable(element) {
                var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                element.querySelector(".panel-header").onmousedown = dragMouseDown;

                function dragMouseDown(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    document.onmouseup = closeDragElement;
                    document.onmousemove = elementDrag;
                }

                function elementDrag(e) {
                    e = e || window.event;
                    e.preventDefault();
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    element.style.top = (element.offsetTop - pos2) + "px";
                    element.style.left = (element.offsetLeft - pos1) + "px";
                }

                function closeDragElement() {
                    document.onmouseup = null;
                    document.onmousemove = null;
                }
            }

            var button = event.target;
            var container = button.closest('div[id^="ctrb_window"]');

            if (!container) {
                console.error('Could not find the container div.');
                return;
            }

            var iframe = container.querySelector('iframe[id^="ui-tinymce-"][id$="_ifr"]');
            if (!iframe) {
                console.error('Could not find the TinyMCE iframe.');
                return;
            }

            var instanceNumber = iframe.id.replace('ui-tinymce-', '').replace('_ifr', '');
            var editor = tinymce.get('ui-tinymce-' + instanceNumber);
            if (editor) {
                var content = editor.getContent();
                console.log("Editor content:", content);

                var floatingPanel = document.getElementById('floatingPanel');
                var spellCheckTextDiv = document.getElementById('spell-check-text');
                spellCheckTextDiv.innerHTML = "Un instant S.V.P";
                floatingPanel.style.display = 'block';
                makeDraggable(floatingPanel);

                var urlApi = "/api/ai/spellCheck?explain=turboExplain";
                if (lv == 3) {
                    urlApi += "3";
                } else if (lv == 2) {
                    urlApi += "2";
                }
                console.log("urlApi : " + urlApi);

                var params = {
                    "community_id": $scope.community.community._id,
                    "kf_user_id": $scope.community.author.userId,
                    "viewId": $scope.currentViewId(),
                    "token": $scope.token,
                    "contribution_id": $scope.contribution._id
                };

                var xhr = new XMLHttpRequest();
                xhr.open('POST', urlApi, true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                var accumulatedData = ''; // Declare accumulatedData to store received chunks

                xhr.onprogress = function () {
                    var chunk = xhr.responseText.slice(accumulatedData.length);
                    accumulatedData += chunk;
                    console.log('Received chunk:', chunk);

                    // Regex for standard format
                    var regexStandard = /(\{.*?\})(?=\{|\s*$)/g;
                    // Regex for spellcheck format
                    var regexSpellcheck = /(\{.*?\})(?=\{|\n|$)/g;
                    var regex = regexStandard; // Default to standard regex

                    // Detect data format
                    if (accumulatedData.includes('"partial"')) {
                        regex = regexSpellcheck;
                        $scope.$apply(function () {
                            var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
                            if (loadingAiDiv) {
                                loadingAiDiv.style.display = 'none';
                            }
                            spellCheckTextDiv.innerHTML = ""; // Clear the previous content
                        });
                    }

                    var match;
                    while ((match = regex.exec(accumulatedData)) !== null) {
                        var jsonString = match[0];
                        console.log('JSON string:', jsonString);
                        var parsedChunk = JSON.parse(jsonString);
                        if (parsedChunk.partial) {
                            console.log('Parsed partial:', parsedChunk.partial);
                            $scope.$apply(function () {
                                var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
                                if (loadingAiDiv) {
                                    loadingAiDiv.style.display = 'none';
                                }
                                spellCheckTextDiv.innerHTML += replaceNewlinesWithBreaks(parsedChunk.partial);  // Append new content
                            });
                        }
                    }
                    accumulatedData = accumulatedData.slice(regex.lastIndex);
                };

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        console.log("Stream complete");
                    } else {
                        console.error("Error loading data:", xhr.statusText);
                        spellCheckTextDiv.innerHTML += "<br>Error loading data: " + xhr.statusText;
                    }
                };

                xhr.onerror = function () {
                    console.error("Network error");
                    spellCheckTextDiv.innerHTML += "<br>Network error";
                };

                xhr.send(JSON.stringify({
                    text: content,
                    params: params
                }));
            } else {
                console.error('Could not find the correct editor.');
            }
        };




        // VERSION QUI UTILISE LLAMA

        // $scope.spellCheckTurboExplain = function(modalId, event, lv) {
        //
        //     var loadingAiDiv = document.querySelector('.loading-ai');
        //
        //     loadingAiDiv.style.display = 'flex';
        //
        //     function makeDraggable(element) {
        //         var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        //         element.querySelector(".panel-header").onmousedown = dragMouseDown;
        //
        //         function dragMouseDown(e) {
        //             e = e || window.event;
        //             e.preventDefault();
        //             pos3 = e.clientX;
        //             pos4 = e.clientY;
        //             document.onmouseup = closeDragElement;
        //             document.onmousemove = elementDrag;
        //         }
        //
        //         function elementDrag(e) {
        //             e = e || window.event;
        //             e.preventDefault();
        //             pos1 = pos3 - e.clientX;
        //             pos2 = pos4 - e.clientY;
        //             pos3 = e.clientX;
        //             pos4 = e.clientY;
        //             element.style.top = (element.offsetTop - pos2) + "px";
        //             element.style.left = (element.offsetLeft - pos1) + "px";
        //         }
        //
        //         function closeDragElement() {
        //             document.onmouseup = null;
        //             document.onmousemove = null;
        //         }
        //     }
        //
        //     var button = event.target;
        //     var container = button.closest('div[id^="ctrb_window"]');
        //
        //     if (!container) {
        //         console.error('Could not find the container div.');
        //         return;
        //     }
        //
        //     var iframe = container.querySelector('iframe[id^="ui-tinymce-"][id$="_ifr"]');
        //     if (!iframe) {
        //         console.error('Could not find the TinyMCE iframe.');
        //         return;
        //     }
        //
        //     var instanceNumber = iframe.id.replace('ui-tinymce-', '').replace('_ifr', '');
        //     var editor = tinymce.get('ui-tinymce-' + instanceNumber);
        //     if (editor) {
        //         var content = editor.getContent();
        //         console.log("Editor content:", content);
        //
        //         var floatingPanel = document.getElementById('floatingPanel');
        //         var spellCheckTextDiv = document.getElementById('spell-check-text');
        //         spellCheckTextDiv.innerHTML = "Un instant S.V.P";
        //         floatingPanel.style.display = 'block';
        //         makeDraggable(floatingPanel);
        //
        //         var urlApi = "/api/ai/spellCheck?explain=turboExplain";
        //         if (lv == 3) {
        //             urlApi += "3";
        //         } else if (lv == 2) {
        //             urlApi += "2";
        //         }
        //         console.log("urlApi : " + urlApi);
        //
        //         var params = {
        //             "community_id": $scope.community.community._id,
        //             "kf_user_id": $scope.community.author.userId,
        //             "viewId": $scope.currentViewId(),
        //             "token": $scope.token,
        //             "contribution_id": $scope.contribution._id
        //         };
        //
        //         var xhr = new XMLHttpRequest();
        //         xhr.open('POST', urlApi, true);
        //         xhr.setRequestHeader('Content-Type', 'application/json');
        //
        //         var accumulatedData = ''; // Declare accumulatedData to store received chunks
        //
        //         xhr.onprogress = function () {
        //             var chunk = xhr.responseText.slice(accumulatedData.length);
        //             accumulatedData += chunk;
        //             console.log('Received chunk:', chunk);
        //             try {
        //                 var regex = /(\{.*?\})(?=\{|\s*$)/g;
        //                 var match;
        //                 while ((match = regex.exec(accumulatedData)) !== null) {
        //                     var jsonString = match[0];
        //                     console.log('JSON string:', jsonString);
        //                     var parsedChunk = JSON.parse(jsonString);
        //                     if (parsedChunk.partial) {
        //                         console.log('Parsed partial:', parsedChunk.partial);
        //                         $scope.$apply(function () {
        //                             var loadingAiDiv = floatingPanel.querySelector('.loading-ai');
        //                             if (loadingAiDiv) {
        //                                 loadingAiDiv.style.display = 'none';
        //                             }
        //
        //                             spellCheckTextDiv.innerHTML = replaceNewlinesWithBreaks(parsedChunk.partial);
        //                         });
        //                     }
        //                 }
        //                 accumulatedData = accumulatedData.slice(regex.lastIndex);
        //             } catch (e) {
        //                 console.error("Error parsing chunk:", e);
        //             }
        //         };
        //
        //         xhr.onload = function () {
        //             if (xhr.status === 200) {
        //                 console.log("Stream complete");
        //             } else {
        //                 console.error("Error loading data:", xhr.statusText);
        //                 spellCheckTextDiv.innerHTML += "<br>Error loading data: " + xhr.statusText;
        //             }
        //         };
        //
        //         xhr.onerror = function () {
        //             console.error("Network error");
        //             spellCheckTextDiv.innerHTML += "<br>Network error";
        //         };
        //
        //         xhr.send(JSON.stringify({
        //             text: content,
        //             params: params
        //         }));
        //     } else {
        //         console.error('Could not find the correct editor.');
        //     }
        // };




        $scope.spellCheckCloseModal = function(){
            $('#spelling-modal').css('display','none');
            $('#spell-check-text').html('Un instant svp...');
            $('#spell-check-explain-text').text("");
        }

        $scope.onLanguageChange = function(language){

            if($scope.copy.body !== ""){
                $scope.textContainer[$scope.lang] = $scope.copy.body;
            }
            if($scope.contribution.title !== "" && $scope.lang !== undefined){
                $scope.langTitle = $scope.lang + "_title";
                $scope.textContainer[$scope.langTitle]=$scope.contribution.title;
            }
            $scope.lang = language;
            $scope.langTitle = $scope.lang + "_title";

            $scope.copy.body = '';
            $scope.contribution.title = '';

            if($scope.textContainer[$scope.lang] !== undefined){
                $scope.copy.body = $scope.textContainer[$scope.lang];
            }
            if($scope.textContainer[$scope.langTitle] !== undefined){
                $scope.contribution.title = $scope.textContainer[$scope.langTitle];
            }
        };


        $scope.getThreads = function() {
            if (!$scope.itmEnabled) {
                return;
            }

            if ($scope.community && $scope.community.community && $scope.token) {
                var params = {
                    "community_id": $scope.community.community._id,
                    "kf_user_id": $scope.community.author._id,
                    "token": $scope.token
                };

                if (!params.kf_user_id || !params.community_id || !params.token) {
                    console.warn("Note enough data when getting ITM threads");
                    console.warn(params);
                    return;
                }

                // Query for all available projects/threads
                $http({ url: itmServer + '/IIUSs/project/get_by_user_id',
                    method: 'POST',
                    data: params,
                    headers: {'Content-Type': 'application/json'}
                })
                    .success(function(result){
                        if (result) {
                            if (result.code && result.code === 'success') {
                                $scope.projects = [];
                                $scope.threads = [];
                                $scope.projectsObj = {};
                                $scope.threadsObj = {};
                                for (var i = 0; i < result.obj.length; ++i) {
                                    var proj = {id: result.obj[i].id,
                                        title: result.obj[i].name
                                    };
                                    $scope.projects.push(proj);
                                    $scope.projectsObj[proj.id] = proj;
                                    for (var j = 0; j < result.obj[i].threads.length; ++j) {
                                        var thrd = {id: result.obj[i].threads[j].id,
                                            title: result.obj[i].threads[j].name,
                                            projectId: result.obj[i].id
                                        };
                                        $scope.threads.push(thrd);
                                        $scope.threadsObj[thrd.id] = thrd;
                                    }
                                }
                            } else if (result.code && result.code === 'failure') {
                                console.error(result.desc);
                            } else {
                                console.error("Get threads: ITM return wrong data!");
                                console.error(result);
                            }
                        }
                    }).error(function(e){
                    console.error("Fetch projects/threads failed!");
                    console.error(e);
                });

                // Query projects/threads for current note
                var params2 = {
                    "community_id": $scope.community.community._id,
                    "note_id": contributionId,
                    "token": $scope.token
                };

                $http({ url: itmServer + '/IIUSs/project/get_by_note_id',
                    method: 'POST',
                    data: params2,
                    headers: {'Content-Type': 'application/json'}
                })
                    .success(function(result){
                        if (result) {
                            if (result.code && result.code === 'success') {
                                $scope.belongsToThreads = [];
                                $scope.belongsToThreadsObj = {};
                                for (var i = 0; i < result.obj.length; ++i) {
                                    for (var j = 0; j < result.obj[i].threads.length; ++j) {
                                        var thrd = {id: result.obj[i].threads[j].id,
                                            title: result.obj[i].threads[j].name,
                                            projectId: result.obj[i].id
                                        };
                                        $scope.belongsToThreads.push(thrd);
                                        $scope.belongsToThreadsObj[thrd.id] = thrd;
                                    }
                                }
                            } else if (result.code && result.code === 'failure') {
                                // Ignore when can't find belonging threads
                            } else {
                                console.error("Get threads for current note: ITM return wrong data!");
                                console.error(result);
                            }
                        }
                    }).error(function(e){
                    console.error("Fetch projects/threads for current note failed!");
                    console.error(e);
                });
            } else {
                console.warn("Get threads missing data");
            }

        };
        $scope.saveToITM = function(isNewNote, cb) {
            if (!$scope.itmEnabled) {
                cb();
                return;
            }

            if (!contributionId) {
                console.warn("ContributionId is undefined");
                cb();
                return;
            }

            var params = {
                "community_id": $scope.community.community._id,
                "kf_user_id": $scope.community.author._id,
                "token": $scope.token,
                "note_id": contributionId,
                "title":  $scope.contribution.title,
                "content": $scope.contribution.data.body,
                "create_time": $scope.contribution.created,
                "modified_time": $scope.contribution.modified,
                "authors": $scope.contribution.authors
            };

            $http({ url: itmServer + '/IIUSs/note/add',
                method: 'POST',
                data: params,
                headers: {'Content-Type': 'application/json'}
            })
                .success(function(result){
                    if (result && result.code && result.code === 'success') {
                        if ($scope.belongsToThreads.length > 0) {
                            for (var i = 0; i < $scope.belongsToThreads.length; ++i) {
                                $scope.notifyITM(isNewNote, $scope.belongsToThreads[i]);
                            }
                        }
                    } else {
                        console.error("Save to ITM failed!");
                        console.error(result);
                    }
                    cb();
                })
                .error(function(error){
                    console.error("Save to ITM failed!");
                    console.error(error);
                    cb();
                });
        };

        $scope.notifyITM = function(isNewNote, thread) {
            $community.getITMToken(function(token, db){
                var params = {
                    'uid': $scope.community.author._id,
                    'database': db,
                    'project' : thread.projectId,
                    'thread' : thread.id,
                    'note_id' : contributionId,
                    'action': "refresh"
                };

                params.message = isNewNote ? 'A new note has been created' : 'A note has been edited';

                $http({ url: itmServer + "/ITM3/msg/broadcast",
                    method: 'POST',
                    data: params,
                    headers: {'Content-Type': 'application/json'}
                }).success(function(result){
                }).error(function(error){
                    console.error("Notify ITM failed!");
                    console.error(error);
                });
            });
        };

        $scope.saveBuildonToITM = function(fromId, toId){
            if (!$scope.itmEnabled) {
                return;
            }

            $community.getITMToken(function(token, db){
                var params = {
                    "token": token,
                    "database": db,
                    "fromnoteid": fromId,
                    "tonoteid": toId,
                    "linktype": 'buildson'
                };

                $http({ url: itmServer + "/WSG/note_note/add",
                    method: 'POST',
                    data: params,
                    headers: {'Content-Type': 'application/json'}
                }).success(function(result){
                    if (result && result.code && result.code === 'success') {
                    } else {
                        console.error("Add buildon failed!");
                        console.error(result);
                    }
                }).error(function(error){
                    console.error("Add buildon failed!");
                    console.error(error);
                });
            });
        };
        $scope.addToITMThread = function(threadId) {
            if (!$scope.itmEnabled) {
                return;
            }

            if (!contributionId) {
                console.warn("ContributionId is undefined");
                return;
            }

            if (!threadId) {
                console.warn("No thread selected!");
                return;
            }

            threadId = parseInt(threadId, 10);

            var params = {
                "community_id": $scope.community.community._id,
                "kf_user_id": $scope.community.author._id,
                "token": $scope.token,
                "thread_id": threadId,
                "note_id": contributionId,
                "title":  $scope.contribution.title,
                "content": $scope.contribution.data.body,
                "create_time": $scope.contribution.created,
                "modified_time": $scope.contribution.modified,
                "authors": $scope.contribution.authors
            };

            $http({ url: itmServer + '/IIUSs/thread/note/add',
                method: 'POST',
                data: params,
                headers: {'Content-Type': 'application/json'}
            })
                .success(function(result){
                    if (result && result.code && result.code === 'success') {
                        $scope.status.savedToITM = true;
                        var thread = {id: threadId,
                            title: $scope.threadsObj[threadId].title,
                            projectId: $scope.threadsObj[threadId].projectId
                        };

                        $scope.belongsToThreads.push(thread);
                        $scope.belongsToThreadsObj[threadId] = thread;
                        $scope.notifyITM(true, thread);
                    } else {
                        console.error("Add to ITM thread failed!");
                        console.error(result);
                        $scope.status.savedToITM = false;
                        $scope.status.savedToITMError = "Add thread Failed!";
                    }
                })
                .error(function(error){
                    console.error("Add to ITM thread failed!");
                    console.error(error);
                    $scope.status.savedToITM = false;
                    $scope.status.savedToITMError = "Add thread Failed!";
                });
        };

        $scope.createITMCommunity = function() {
            var params = {
                "community_name": $scope.community.community.title,
                "manager_code": $scope.community.community.managerRegistrationKey,
                "writer_code": $scope.community.community.registrationKey,
                "reader_code": "",
                "community_id": $scope.community.community._id,
                "community_url": $community.hostURL,
                "token": $scope.token
            };
            var url = itmServer + '/IIUSs/community/add';
            $http({ url: url,
                method: 'POST',
                data: params,
                headers: {'Content-Type': 'application/json'}
            }).success(function(result){
                $scope.status.createdITMCommunity = true;
                $scope.status.createITMCommunityFailed = false;
            }).error(function(error){
                $scope.status.createITMCommunityFailed = true;
                $scope.status.createdITMCommunity = false;
                $scope.status.createITMCommunityError = "Create ITM Community failed!";
            });
        };

        $scope.isFavnote=function(){
            if(!$scope.contribution){
                return false;
            }else{
                return $scope.contribution.favAuthors.includes($community.getAuthor().userId);
            }
        };

        $scope.addNoteToFavourite = function () {
            $http.post('/api/objects/addTofav/' + $scope.contribution.communityId + '/' + $scope.contribution._id)
                .success(function (result) {
                    $community.getObject(contributionId, function (contribution) {
                        if (!contribution.data) {
                            contribution.data = {};
                        }
                        $scope.contribution = contribution;
                    });

                }).error(function (error) {
                window.alert('Could not add note to your favourites, please try later');
            });

        };


        $scope.remNoteFromFavourite = function () {
            $http.post('/api/objects/remFromfav/' + $scope.contribution.communityId + '/' + $scope.contribution._id)
                .success(function (result) {
                    $community.getObject(contributionId, function (contribution) {
                        if (!contribution.data) {
                            contribution.data = {};
                        }
                        $scope.contribution = contribution;
                    });
                }).error(function (error) {
                window.alert('Could not remove note from your favourites, please try later');
            });

        };

        $community.getObject(contributionId, function (contribution) {
            if (window.localStorage) {
                var item = window.localStorage.getItem('kfdoc');
                if (item) {
                    $scope.status.recoverable = true;
                }
            }
            if (!contribution.data) {
                contribution.data = {};
            }
            $scope.contribution = contribution;
            if (contribution.type === 'Context') {
                $scope.itmOldStatus = false;
                if (contribution.data.plugins && contribution.data.plugins.itm) {
                    $scope.itmOldStatus = true;
                }
            }
            if($scope.contribution.docId !== '' && $community.isPluginEnabled('googledocs')){
                $scope.isGoogleDoc = true;
                $scope.refreshGoogleDoc();
                $scope.contribution.data.body = $sce.trustAsHtml($scope.contribution.data.body);
            }
            $community.enter($scope.contribution.communityId, function() {

                $scope.community = $community.getCommunityData();

                if ($scope.$parent.status !== undefined) {
                    $scope.status.googleOAuth = $scope.$parent.status.googleOAuth;
                }
                else {
                    $scope.checkGoogleOAuth();
                    $community.refreshScaffolds(function () {
                    });
                    $scope.scaffolds = $community.getScaffolds();
                }

                $community.refreshContext(contextId, function (context) {
                    $community.getContext(null, function (context) {
                        $scope.context = context;
                        if ($community.isPluginEnabled('googledocs')) {
                            $scope.googleEnabled = true;
                        } else {
                            $scope.googleEnabled = false;
                        }

                        //Added for multi langugage notes
                        if ($scope.context.data.plugins !== undefined && $scope.context.data.plugins.multilanguage) {
                            $scope.multilanguageEnabled = true;
                        }
                        else {
                            $scope.multilanguageEnabled = false;
                        }
                        if($scope.multilanguageEnabled) {
                            $scope.langObj = null;
                            $scope.langObj = $community.getLanguageEnabled();
                            angular.forEach($scope.langObj, function (value, key) {

                                if ($scope.langObj[key] === true) {
                                    $scope[key] = true;
                                } else {
                                    $scope[key] = false;
                                }
                            });
                        }
                        //Added for multi langugage notes
                        if ($scope.googleEnabled && $scope.contribution.docId !== ''){
                            $scope.isGoogleDoc = true;
                            $scope.refreshGoogleDoc();
                        } else {
                            $scope.isGoogleDoc = false;
                        }
                        $scope.itmEnabled = $community.isPluginEnabled('itm');
                        if ($scope.itmEnabled) {
                            $scope.getThreads();
                        }
                    });
                    $scope.initializingHookInvoked = true;
                    $scope.initializingHooks.forEach(function (func) {
                        func();
                    });
                });
                $scope.updateTitle();
                if ($scope.contribution.keywords) {
                    var keywordsStr = '';
                    $scope.contribution.keywords.forEach(function (keyword) {
                        if (keywordsStr.length !== 0) {
                            keywordsStr += '; ';
                        }
                        keywordsStr += keyword;
                    });
                    $scope.copy.keywords = keywordsStr;
                }
                $ac.mixIn($scope, contribution);
                $scope.copy.body = contribution.data.body;

                //Added for multi langugage notes : starts
                if($community.isPluginEnabled('multilanguage')) {
                    $scope.communityDefaultLang = $community.getCurrentCommunityData().lang;
                    $scope.authorInfo = $community.getAuthor();
                    if ($scope.authorInfo !== undefined) {
                        if ($scope.authorInfo.lang !== null && $scope.authorInfo.lang !== "") {
                            $scope.lang = $scope.authorInfo.lang;
                            $scope.authlang = $scope.authorInfo.lang;
                        }
                    }

                    if ($scope.communityDefaultLang !== undefined && $scope.textContainer[$scope.communityDefaultLang + "_title"] === undefined) {
                        if (!$scope.contribution.title.includes('Community Setting:')) {
                            $scope.textContainer[$scope.communityDefaultLang + "_title"] = $scope.contribution.title;
                        }
                    }
                    angular.forEach(contribution.data, function (value, key) {
                        if (key === 'body' && value !== "" && contribution.data.body !== null &&
                            $scope.communityDefaultLang !== undefined && $scope.textContainer[$scope.communityDefaultLang] === undefined) {
                            $scope.textContainer[$scope.communityDefaultLang] = value;
                        }
                        if (key !== 'body' && key !== 'languages') {
                            $scope.textContainer[key] = value;
                        }
                    });

                    if ($scope.lang !== undefined && $scope.lang !== "") {
                        if ($scope.textContainer[$scope.lang + "_title"] !== undefined) {
                            $scope.contribution.title = $scope.textContainer[$scope.lang + "_title"];
                        }
                        else {
                            if (!$scope.contribution.title.includes('Community Setting:')) {
                                $scope.contribution.title = '';
                            }
                        }
                        if ($scope.textContainer[$scope.lang] !== undefined) {
                            $scope.copy.body = $scope.textContainer[$scope.lang];
                        }
                        else {
                            $scope.copy.body = "";
                        }
                    }
                }
                else {
                    if($community.getCurrentCommunityData().lang !== undefined)                 //if ever multilanguage was enabled then it would display
                    {                                                                           // title/content of community's default language
                        $scope.copy.body = contribution.data[$community.getCurrentCommunityData().lang] !== undefined ? contribution.data[$community.getCurrentCommunityData().lang] : contribution.data.body;
                        $scope.contribution.title = contribution.data[$community.getCurrentCommunityData().lang +'_title'] !== undefined ?
                            contribution.data[$community.getCurrentCommunityData().lang+'_title'] : $scope.contribution.title;
                    }
                    else{                                                                       //for older communities and/or communties that never enabled multilanguage note feature
                        $scope.copy.body = $scope.contribution.data.body;
                    }
                }
                //Added for multi langugage notes : ends
                $scope.contribution.isRiseabove = function() {
                    return contribution.type === 'Note' && contribution.data && contribution.data.riseabove && contribution.data.riseabove.viewId;
                };
                $scope.prepareRiseabove();
                window.contribution = contribution;
                $scope.initializeDirtyStatusHandlers();

                $scope.contribution.authors.forEach(function (authorId) {
                    $scope.authors.push($community.getMember(authorId));
                });


                // $scope.contribution.getGroupName = function() {
                //     var groupId = $scope.contribution.group;
                //     if (!groupId) {
                //         return '(none)';
                //     }
                //     var group = $scope.community.groups[groupId];
                //     if (!group) {
                //         return groupId + ' (loading)';
                //     }
                //     return group.title;
                // };
                // $scope.selected.group = $community.getGroup($scope.contribution.group);
                // $scope.$watch('selected.group', function() {
                //     if ($scope.selected.group) {
                //         $scope.contribution.group = $scope.selected.group._id;
                //     }
                // });
                // $community.refreshGroups();
                $community.refreshPromisingcolorobjs(function () {
                    $scope.promisingIdeacolorobjsarr = $community.getPromisingcolorobjsArray();
                    $scope.setPromisingColorData();
                });
                if ($scope.promisingIdeacolorobjsarr.length === 0) {
                    $scope.setPromisingColorData();
                }

                $scope.updateToConnections(function () {
                    $scope.updateAnnotations();
                    $scope.updatepromisingIdeaobjs();
                    $scope.updateFromConnections(function (links) {
                        $scope.preProcess();
                        $scope.updateAttachments(links);
                    });
                });

                // $scope.updateRecords();
                $scope.communityMembers = $community.getMembersArray();
                $community.refreshMembers();
                if ($scope.isEditable() && $scope.contribution.type !== 'Attachment' && !$scope.contribution.isRiseabove()) {
                    $scope.status.edittabActive = true;
                }
                if ($scope.contribution.status === 'active') {
                    window.setTimeout(function () {
                        $community.read($scope.contribution);
                    }, 1200);
                }
                if ($('#openGEditor_' + contributionId).length) {
                    $scope.editGoogleDoc();
                }
            });
        }, function (msg, status) {
            $scope.status.error = true;
            $scope.status.errorMessage = msg;
        });

        $scope.checkGoogleOAuth = function () {
            $http.post('/auth/googleOAuth/checkStatus', {
                userName: $scope.community.author.userName
            }).success(function (result) {
                $scope.status.googleOAuth = result.data;
            });
        };

        $scope.trustedHtml = function (plainText) {
            if (typeof plainText !== 'string') {
                return plainText;
            }
            return $sce.trustAsHtml(plainText);
        };


        $scope.initializeDirtyStatusHandlers = function () {
            $scope.$watch('contribution.title', function () {
                $scope.updateDirtyStatus();
            });
            $scope.$watch('copy.keywords', function () {
                $scope.updateDirtyStatus();
            });
            $scope.$watch('copy.body', function () {
                if ($scope.mceEditor) {
                    if (!$scope.scaffoldUpdated) {
                        $scope.updateDirtyStatus();
                    } else {
                        $scope.scaffoldUpdated = false;
                    }
                }
            });
            $scope.$watch('contribution.permission', function () {
                $scope.updateDirtyStatus();
            });
            $scope.$watch('contribution.isRiseabove', function () {
                $scope.updateDirtyStatus();
            });
            $scope.$watch('authors', function () {
                $scope.updateDirtyStatus();
            }, true);
        };

        $scope.getAuthorString = function () {
            return $community.makeAuthorString($scope.authors);
        };

        $scope.currentViewId = function () {
            return contextId;
        };

        $scope.updateToConnections = function (next) {
            $http.get('/api/links/to/' + contributionId).success(function (links) {
                $scope.toConnections = links;
                if (next) {
                    next();
                }
            });
        };

        $scope.updateFromConnections = function (next) {
            $http.get('/api/links/from/' + contributionId).success(function (links) {
                $scope.fromConnections = links;
                if (next) {
                    next(links);
                }
            });
        };


        $scope.updateAttachments = function(links) {
            if ($scope.mceEditor) {
                var inlineAttachments = $scope.mceEditor.dom.select('.inline-attachment');
                $scope.inlineAttachmentIds = {};
                for (var i =0; i < inlineAttachments.length; i++ ){
                    for (var j = 0; j < inlineAttachments[i].classList.length; j++){
                        if (inlineAttachments[i].classList[j].length === 24) { //Find 24 char long MongoDB ids
                            $scope.inlineAttachmentIds[inlineAttachments[i].classList[j]] = true;
                        }
                    }
                }
            }
            $scope.images = [];
            links.forEach(function (each) {
                if (each.type === 'attach') {

                    $community.getObject(each.to, function(contribution) {
                        if (!$scope.inlineAttachmentIds[contribution._id]) {
                            $scope.images.push(contribution);
                        }
                    });
                }
            });
        };
        $scope.getFromLink = function(attachment) {
            for (var i = 0; i < $scope.fromConnections.length; i++) {
                if ($scope.fromConnections[i].to === attachment._id) {
                    return $scope.fromConnections[i];
                }
            }
            return null;
        };

        $scope.updateRecords = function() {
            $http.get('/api/records/object/' + contributionId).success(function(records) {

                $scope.records = records;
                $scope.records.forEach(function (record) {
                    record.user = $community.getMember(record.authorId);
                    record.getTime = function () {
                        return $scope.getTimeString(record.timestamp);
                    };
                });
            });
        };

        $scope.authorSelected = function (author) {
            if (_.includes($scope.authors, author)) {
                window.alert('already included');
                return;
            }
            $scope.authors.push(author);
        };

        $scope.removeAuthor = function (author) {
            var index = $scope.authors.indexOf(author);
            if (index === 0) {
                window.alert('cannot remove the Primary Author');
                return;
            }
            if (index >= 0) {
                $scope.authors.splice(index, 1);
            }
        };

        function pullDataFromGoogle(arg1) {
            if ($scope.popupGWindow && !$scope.popupGWindow.closed) {
                setTimeout(pullDataFromGoogle, 500, arg1);
            }
            else {
                //get data from google doc
                $scope.refreshGoogleDoc();
            }

        }

        $scope.popupGAuthorizationNotice = function () {
            var message = '<div id="google_authorization_notice"><label style="font-size:14px;margin-top:5px;">Vous êtes sur le point d\'accéder au site Web de Google pour obtenir une autorisation.</label>';

            message += '<div style="text-align:center;"><button class="btn btn-primary btn-dialog" id="go2G4Authorization">Ok</button><button class="btn btn-primary btn-dialog" id="notice_cancel">Annuler</button></div></div>';
            $('#windows').append(message);
            $("#google_authorization_notice").dialog({
                modal: true,
                open: function() {
                    $('#go2G4Authorization').bind('click', function(){
                        var un = $community.getAuthor().userName;
                        var data = {};
                        data.userName = un;
                        data.viewId = contextId;
                        $http.post('/auth/googleOAuth/getOAuthUrl', data)
                            .success(function(result) {
                                window.location.href = result.data;
                            }).error(function() {
                        });
                    });
                    $('#notice_cancel').bind('click', function(){
                        $("#google_authorization_notice").dialog('close');
                    });
                },
                close: function() {
                    $(this).remove();
                }
            });

        };

        $scope.editGoogleDoc = function () {
            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                $scope.popupGAuthorizationNotice();
            }
            else {
                //add google file permission and display google editor
                var sharedList = $scope.contribution.docShared;
                var currentAuthor = $community.getAuthor()._id;
                if (sharedList.indexOf(currentAuthor) >= 0) {
                    var width = window.innerWidth * 0.7;
                    var height = window.innerHeight * 0.7;
                    var top = window.innerHeight * 0.1;
                    var left = window.innerWidth * 0.1;
                    $scope.popupGWindow = window.open("https://docs.google.com/document/d/" + $scope.contribution.docId + "/edit", "popup", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top);
                    setTimeout(pullDataFromGoogle, 500, $scope.contribution._id);
                }
                else {
                    var dt = {};
                    dt.authorId = $community.getAuthor()._id;
                    dt.userName = $community.getAuthor().userName;
                    dt.createdBy = $scope.contribution.createdBy;
                    dt.docId = $scope.contribution.docId;
                    dt.noteId = $scope.contribution._id;
                    $http.post('/auth/googleFile/addPermission', dt)
                        .success(function (result) {
                            $scope.contribution.docShared.push(result.data);
                            var width = window.innerWidth * 0.7;
                            var height = window.innerHeight * 0.7;
                            var top = window.innerHeight * 0.1;
                            var left = window.innerWidth * 0.1;
                            $scope.popupGWindow = window.open("https://docs.google.com/document/d/" + $scope.contribution.docId + "/edit", "popup", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top);
                            setTimeout(pullDataFromGoogle, 500, $scope.contribution._id);
                        }).error(function () {
                    });
                }


            }

        };

        $scope.refreshGoogleDoc = function () {
            var data = {};
            data.noteId = $scope.contribution._id;
            data.docId = $scope.contribution.docId;
            data.userName = $scope.contribution.createdBy;
            $http.post('/auth/googleFile/export', data)

                .success(function(result) {
                    $scope.contribution.title = result.data.title;
                    $scope.contribution.data.body = $sce.trustAsHtml(result.data.body);
                    $scope.copy.body = $scope.contribution.data.body;
                }).error(function() {
            });

        };


        $scope.translateToLang = function (lang){
            var noteText = $scope.html2PlainText($scope.copy.body);
            var numChunks = Math.ceil(noteText.length / 4900);
            $scope.translationChunks=numChunks;
            var chunks = [];

            for (var i = 0, o = 0; i < numChunks; ++i, o += 4900) {
                chunks[i] = noteText.substr(o, 4900);
            }
            $scope.translatedString = '';
            var count=0;
            for (i = 0; i < numChunks ; i++) {
                $scope.translateFilteredString(chunks[i], lang).then(
                    function (res) {// jshint ignore:line
                        count+=1;
                        if (res.responseDesc && res.responseDesc === "Success") {
                            $scope.translatedString += res.text;
                            if ($scope.translatedString !== '' && count=== $scope.translationChunks) {
                                $scope.showTranslatedStringWindow($scope.translatedString);
                            }
                        }
                    }
                ).catch(function (error) {// jshint ignore:line
                    window.alert("Error in Translating this Note.. Please try Later");
                });
            }
        };

        $scope.showTranslatedStringWindow =function (translatedString){
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'NoteTranslator.html',
                controller: 'NoteTranslatorCtrl',
                size: 'md',
                resolve: {
                    noteText: function () {
                        return translatedString;
                    }
                },
                appendTo: document
            });
        };

        $scope.translateFilteredString = function (text,lang) {
            var deferred = $q.defer();
            $http({'url':'/api/translate' ,
                method: "GET",
                params: {'text': text,'language':lang}
            })
                .success(function (data) {
                    deferred.resolve(data);
                }).error(function (msg, code) {
                deferred.reject(msg);
            });
            return deferred.promise;
        };


        $scope.html2PlainText=function (html){
            html.replace(/<[^>]*>/g, '');
            var text = html.replace(/<[^>]*>/g, '');
            text=text.replace(/(\r\n|\n|\r)/gm, "");
            return text;
        };



        /**
         * @description This function is called when the user saves the contribution
         * @return {null}
         */
        $scope.contribute = function() {

            var cont = $scope.contribution;
            console.log("count: "+ cont.data.body)
            var editor = tinymce.activeEditor;
            // Checking if editor exist else wordCount=0 for other contributions other that notes
            var wordCount= 0;
            if (editor){
                wordCount = editor.plugins.wordcount.getCount();
            }
            cont.visitorRole = $community.isPluginEnabled('visitorrole');
            if (cont.title.length === 0 || cont.title === '') {
                $translate('title_required').then(function (translation) {
                    window.alert(translation);
                }, function (translationId) {
                    // TODO do something if unable to provide translation
                });
                return;
            }

            if (cont.type === 'Note' && !$scope.isGoogleDoc && !$scope.mceEditor) { //avoid contribution in empty body
                window.alert('mceEditor have not initialized yet.');
                return;
            }

            //synchronization checking
            if (cont.type === 'Note' && !$scope.isGoogleDoc) {
                var editorContent = tinymce.activeEditor.getContent();
                var tempBodyText=$scope.copy.body;
                if(!tempBodyText.includes('<!DOCTYPE')){
                    tempBodyText= "<!DOCTYPE html><html><head></head><body>"+$scope.copy.body+"</body></html>";
                }
                // editorContent = editorContent.replace(/(\r\n|\n|\r)/gm,"")
                // editorContent = editorContent.replace(/[^a-zA-Z0-9 ]/g, '');
                // editorContent = editorContent.replace(/\s+/g, '')
                // tempBodyText = tempBodyText.replace(/(\r\n|\n|\r)/gm,"");
                // tempBodyText = tempBodyText.replace(/[^a-zA-Z0-9 ]/g, '');
                // tempBodyText = tempBodyText.replace(/\s+/g, '')
                // if ($scope.copy.body!=='' && tempBodyText!==editorContent) {
                //     window.alert('L\'éditeur n\'est pas encore synchronisé avec le serveur, réessayez.');
                //     return;
                // }
            }

            $scope.status.isContributionCollapsed = false;
            $scope.status.contribution = 'saving';

            $scope.preContributeHooks.forEach(function (each) {
                each();
            });

            cont.authors = _.map($scope.authors, '_id');
            if ($scope.copy.keywords) {
                $scope.contribution.keywords = [];
                var keywordsArray = $scope.copy.keywords.split(';');
                keywordsArray.forEach(function (keyword) {
                    var word = keyword.trim();
                    if (word.length <= 0) {
                        return;
                    }
                    $scope.contribution.keywords.push(word);
                });
            }

            if (cont.type === 'Note') {
                if ($scope.isGoogleDoc) {
                    $scope.refreshGoogleDoc();
                }

                //$scope.note.body = tinymce.activeEditor.getContent();
                //tinymce.activeEditor.isNotDirty = true;
                var isNewNote = cont.status === 'unsaved';
                cont.status = 'active';
                $scope.contribution.wordCount = wordCount;

                $scope.postProcess($scope.copy.body, function(jq) { // post process required for formatting of note
                    //Added for multi langugage notes : start
                    $scope.allLanguageCode = $kfutil.getLanguages();
                    if($scope.multilanguageEnabled) {
                        $scope.onLanguageChange($scope.lang);
                        cont.title = $scope.contribution.title;
                        if ($scope.textContainer[$scope.authlang + "_title"] !== undefined && $scope.textContainer[$scope.authlang + "_title"] !== '') {
                            $scope.contribution.title = $scope.textContainer[$scope.authlang + "_title"];
                        }
                        else {
                            if ($scope.textContainer[$scope.communityDefaultLang + "_title"] !== undefined && $scope.textContainer[$scope.communityDefaultLang + "_title"] !== '') {
                                $scope.contribution.title = $scope.textContainer[$scope.communityDefaultLang + "_title"];
                            }
                        }
                        angular.forEach($scope.textContainer, function (value, key) {
                            if (key !== undefined && value !== "" && value !== null) {
                                //cont.data[key] = jq.html();
                                cont.data[key] = value;
                                if (value === blankHTMLDoc) {
                                    var index = cont.langInNote.indexOf($scope.allLanguageCode[key]);
                                    if (index !== -1) {
                                        cont.langInNote.splice(index, 1);
                                    }
                                }
                                if (value !== undefined && value !== blankHTMLDoc && cont.langInNote.indexOf($scope.allLanguageCode[key]) === -1) {
                                    if ($scope.allLanguageCode[key] !== undefined) {
                                        cont.langInNote.push($scope.allLanguageCode[key]);
                                    }

                                }
                            }
                        });

                    }
                    //Added for multi langugage notes : ends
                    else{
                        if($scope.multilanguageEnabled && $community.getCurrentCommunityData().lang !== undefined)                 //if ever multilanguage was enabled then it would save
                        {                                                                           // title/content in community's default language
                            cont.data[$community.getCurrentCommunityData().lang] = $scope.copy.body;
                            cont.data[$community.getCurrentCommunityData().lang+'_title'] = $scope.contribution.title;

                            $scope.enabledLang = $community.getLanguageEnabled();
                            angular.forEach(cont.data, function (value, key) {
                                if($scope.allLanguageCode[key] !== undefined)
                                {
                                    cont.langInNote.push($scope.allLanguageCode[key]);
                                }
                            });
                            if(cont.langInNote.indexOf($scope.allLanguageCode[$community.getCurrentCommunityData().lang]) === -1){
                                cont.langInNote.push($scope.allLanguageCode[$community.getCurrentCommunityData().lang]);
                            }


                        }
                        else {
                            cont.data.body = jq.html();
                        }
                    }
                    var text = jq.text();
                    cont.text4search = '( ' + cont.title + ' ) ' + text + ' ( ' + $scope.copy.keywords + ' )';

                    $scope.sendContribute() // Save the contribution to server
                        .then(
                            function(res){ // Handle save success
                                $scope.saveToITM(isNewNote, function(){
                                    $scope.closeRequest(); // Close the editor on success
                                });
                                $scope.status.isContributionCollapsed = true; // recollapse the continue edit button
                                //Remove the contribution from localstorage
                                if (window.localStorage) {
                                    localStorage.removeItem("note_" + cont._id);
                                }
                            },
                            function(res){ // Handle save fail
                                console.log(res);
                            }
                        ) // Handle save error.
                        .finally(function(){
                            return;
                        });
                });

            }

            if (cont.type === 'Context') {
                if (!$scope.itmOldStatus && cont.data.plugins && cont.data.plugins.itm) {
                    $scope.itmOldStatus = true;
                    $scope.createITMCommunity();
                } else {
                    $scope.itmOldStatus = false;
                }
            }
            if (cont.type === 'Drawing') {
                cont.status = 'active';
                var wnd = document.getElementById('svgedit').contentWindow;
                wnd.svgCanvas.setResolution('fit', 100);
                if (!cont.data) {
                    cont.data = {};
                }
                var bg=wnd.svgCanvas.current_drawing_.all_layers[0];
                var point=wnd.svgCanvas.current_drawing_.all_layers[1];
                var widd=point[1].getBBox().width;
                var heig=point[1].getBBox().height;
                var rec=bg[1].children[1];
                if(rec.attributes.fill.value==="none"){
                    var po=wnd.svgCanvas.current_drawing_.all_layers[1];
                    if(po[1].childNodes.length > 1){
                        wnd.svgCanvas.current_drawing_.svgElem_.setAttribute("width",widd+2);
                        wnd.svgCanvas.current_drawing_.svgElem_.setAttribute("height",heig+2);
                        var p=wnd.svgCanvas.current_drawing_.all_layers[0];
                        p[1].childNodes[1].setAttribute("width",widd);
                        p[1].childNodes[1].setAttribute("height",heig);
                        wnd.svgCanvas.selectAllInCurrentLayer();
                        wnd.svgCanvas.groupSelectedElements();
                        wnd.svgCanvas.alignSelectedElements('l','page');
                        wnd.svgCanvas.alignSelectedElements('t','page');
                        wnd.svgCanvas.ungroupSelectedElement();
                        wnd.svgCanvas.clearSelection();
                    }
                }
                else{
                    console.log("");
                }
                wnd.svgCanvas.setResolution('fit', 'fit');
                cont.data.svg = wnd.svgCanvas.svgCanvasToString();
                //wnd.svgEditor.showSaveWarning = false;
            }

            if (cont.type !== 'Note') { // since we are already saving when it is a note.
                //Added for multilanguage notes :start
                console.log(cont.data.plugins);
                if(cont.data.plugins !== undefined && cont.data.plugins.multilanguage) {
                    if (cont.data.defaultLang.length === 0) {
                        window.alert('Please select default language');
                        return;
                    }
                    if (cont.data.languages.indexOf(cont.data.defaultLang) === -1) {          //Adds default language to enabled language list,
                        cont.data.languages.push(cont.data.defaultLang);                    // if user removed default language from the list
                    }
                    if(cont.langInNote === undefined)
                    {
                        cont.langInNote = [];
                        if(cont.langInNote.indexOf(cont.data.defaultLang)=== -1){
                            cont.langInNote.push(cont.data.defaultLang);
                        }
                    }

                    $scope.communityData = $community.getCurrentCommunityData();
                    $scope.communityData.lang = cont.data.defaultLang;
                    $community.updateCommunity($scope.communityData);
                    $scope.authorInfo = $community.getAuthor();
                    if (cont.data.languages.indexOf($scope.authlang) === -1) {
                        if($scope.authorInfo.lang === undefined) {
                            $scope.authorInfo.lang = $scope.communityData.lang;
                            $community.modifyObject($scope.authorInfo);
                        }
                    }
                    //Added for multilanguage notes : end
                }
                $scope.sendContribute() // Save the contribution to server
                    .then(
                        function(res){ // Save success
                            $scope.status.isContributionCollapsed = true; // recollapse the continue edit button
                            $scope.closeRequest(); // Close the editor on success
                        },
                        function(res){ // Handle save error.
                            console.log(res);
                        }
                    );
            }
        };
        /**
         * @description This function sends the current contribution to the server
         * @return {defer} resolves the promise on save success.
         */
        $scope.sendContribute = function() {
            var deferred = $q.defer(); //Create a new promise
            $community.modifyObject($scope.contribution, function() {
                $scope.status.dirty = false;

                $scope.$emit('update-dirty-contribution', {id: $scope.contribution._id, dirty: $scope.status.dirty, body: $scope.copy.body, keywordsStr: $scope.copy.keywords, contribution: $scope.contribution});
                $scope.status.contribution = 'success';
                /* contributor should be a first reader */
                $community.read($scope.contribution);
                /* notification */
                if ($scope.contribution.type === 'Note') {
                    $community.notify($scope.contribution, contextId);
                    $scope.updateFromConnections($scope.updateAttachments);
                }
                //After the note is saved, resolve the promise
                deferred.resolve('Note save success');

            }, function() {

                $scope.status.contribution = 'failure';
                if (window.localStorage) {
                    window.localStorage.setItem('kfdoc', $scope.copy.body);
                    $scope.status.contribution = 'stored';
                }
                //If there is a failure, reject the promise
                deferred.reject("Note failed to save");
            });
            return deferred.promise;
        };

        $scope.recover = function () {
            if (window.localStorage) {
                var item = window.localStorage.getItem('kfdoc');
                if (item) {
                    $scope.copy.body = item;
                }
            }
        };


        $scope.insertImg = function(){
            var parentDOM = document.getElementById("attachment-container");
            var selectedImgs = parentDOM.getElementsByClassName("selected");
            if (selectedImgs.length === 0) {
                return;
            }

            var html = "";
            var maxWidth = 200;
            for(var i = 0 ; i< selectedImgs.length; i++){
                var tagName = selectedImgs[i].tagName;
                var width = selectedImgs[i].naturalWidth;
                if(width > maxWidth){
                    width = maxWidth;
                }
                if (tagName === 'IMG') {
                    var data_mce_src = selectedImgs[i].getAttribute("src");
                    var className = '';
                    for (var j = 0; j < selectedImgs[i].classList.length; j++){
                        if (selectedImgs[i].classList[j].length === 24) { //Find 24 char long classes, one of them might be MongoDB id
                            className += selectedImgs[i].classList[j] + ' ';
                        }
                    }
                    html += '<img class="inline-attachment ' + className + '" src="' + data_mce_src + '" width="' + width + 'px" alt="" data-mce-src="' + data_mce_src + '">';
                }
            }
            $scope.insertText(html);
        };

        $scope.playVideo = function (attachment) {
            var url = attachment.data.url;
            var timestamp = attachment.data.uploadTS;
            var title = attachment.title;
            if (timestamp === undefined) {
                timestamp = Date.now();
            }
            var diff = (Date.now() - timestamp) / 1000;

            var width = window.innerWidth * 0.8;
            var height = window.innerHeight * 0.8;

            if(url.indexOf('http') === 0 && timestamp !== undefined && diff >= 600){

                var top = window.innerHeight * 0.1;
                var left = window.innerWidth * 0.1;
                window.open(url, "popup", "width=" + width + ",height=" + height + ",left=" + left + ",top=" + top);
            }
            else {
                if ($('#video_play_dialog').length) {
                    return;
                }
                if (url.indexOf('http') === 0) {
                    url = attachment.data.oldUrl;
                }
                var str = '<div id="video_play_dialog"><div class="head_area"><label>' + title + '</label></div>';
                str += '<div class="video_content"><video controls="controls" height="' + (height - 60) + '"><source src="' + url + '" type="video/mp4"/></video></div>';
                str += '</div>';
                $('#windows').append(str);

                $('#video_play_dialog').dialog({
                    width: width,
                    height: height,
                    create: function () {
                        $(this).css('padding', '1px');
                    },
                    open: function () {
                    },
                    drag: function() {

                    },
                    close: function () {
                        $(this).remove();
                    }
                });
            }
        };


        $scope.closeRequest = function () {
            var message = {
                noteId: $scope.contribution._id,
                request: 'close'
            };

            // Send message to parent window if in an iframe
            if (window.top !== window.self) {
                window.parent.postMessage(message, '*');
            }

            // Simulate a click on the close button of the dialog
            $('.ui-dialog-titlebar-close').click();

            // Fallback if dialog element does not exist or is not initialized
            if(document.getElementById('ctrb_window_' + contributionId) === null){
                window.close();
            } else {
                // Optional: You can add a fallback close method here
                window.closeDialog('ctrb_window_' + contributionId);
            }
        };


        $scope.preProcess = function() {
            var bodyWithScaffold = $kftag.preProcess($scope.copy.body, $scope.toConnections, $scope.fromConnections);
            if (bodyWithScaffold !== $scope.copy.body) {
                $scope.copy.body = bodyWithScaffold;
                $scope.scaffoldUpdated = true;
            }
            $scope.status.initializing = false;
        };

        $scope.postProcess = function (text, handler) {
            $kftag.postProcess(text, contributionId, $scope.toConnections, $scope.fromConnections,
                function (jq) {
                    handler(jq);
                    // not effecient
                    // we need a way of to reflect changes to the copy text
                    $scope.updateToConnections();
                    $scope.updateFromConnections();
                });
        };

        $scope.updateDirtyStatus = function () {
            if (!$scope.isEditable()) {
                $scope.status.dirty = false;
                $scope.$emit('update-dirty-contribution', {id: $scope.contribution._id, dirty: $scope.status.dirty});
                return;
            }
            if ($scope.status.initializing === 'true') {
                if ($scope.contribution.status === 'active') {
                    $scope.status.dirty = false;
                    $scope.$emit('update-dirty-contribution', {id: $scope.contribution._id, dirty: $scope.status.dirty});
                    return;
                }
            }
            $scope.status.dirty = true;
            $scope.$emit('update-dirty-contribution', {id: $scope.contribution._id, dirty: $scope.status.dirty});
        };

        $(window).bind('beforeunload', function (e) {
            if ($scope.status.dirty && $scope.contribution.type === 'Note') {
                return 'The contribution is not contributed. Are you sure to leave?';
            }
            return;
        });

        $scope.buildson = function () {
            var w;
            if ($scope.isMobile()) {
                w = window.open('');
            }
            var mode = {};
            mode.permission = $scope.contribution.permission;
            mode.group = $scope.contribution.group;

            $community.createNoteOn(mode, $scope.contribution._id, function(newContribution) {
                $scope.saveBuildonToITM(newContribution._id, $scope.contribution._id);
                $community.getLinksTo($scope.contribution._id, "contains", function(links){
                        links.forEach(function(link) {
                            $community.saveContainsLinktoITM(link.from, newContribution._id);
                        });
                    },
                    function(){
                        console.error("Can't get Views that contains note: " + $scope.contribution._id);
                    });

                var url = './contribution/' + newContribution._id;
                if (w) {
                    w.location.href = url;
                } else if (window.openContribution) {
                    window.openContribution(newContribution._id);
                } else {
                    window.open(url, '_blank');
                }
            });
        };

        $scope.openGoogleDocSetting_buildson = function () {
            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                $scope.popupGAuthorizationNotice();
            }
            else {
                var fromId = $scope.contribution._id;
                if ($scope.$parent.status !== undefined) {
                    $scope.$parent.openGoogleDocSetting(fromId);
                }
                else {
                    $scope.openGoogleDocSetting(fromId);
                }
            }

        };

        $scope.openGoogleDocSetting = function (fromId) {
            if ($('#googleDoc_dialog').length) {
                return;
            }
            var width = 600;
            var height = 350;
            var wmax = window.innerWidth * 0.8;
            if (width > wmax) {
                width = wmax;
            }
            var hmax = window.innerHeight * 0.8;
            if (height > hmax) {
                height = hmax;
            }
            var to = fromId;
            if (to === undefined) {
                to = '';
            }
            $scope.scaffoldCurrent = $scope.scaffolds[0];
            var str = '<div id="googleDoc_dialog"><div class="head_area"><label>Google Document Settings</label></div>';
            str += '<div class="title_area"><label>Title</label><input id="gdoc_title" type="text" value=""/></div>';
            str += '<div class="setting_area"><fieldset><legend>Co-authors</legend>';
            str += '<div class="author_data">';
            str += '<div ng-repeat="a in communityMembers" ><input type="checkbox" value="{{a._id}}" name="coauthors">{{a.name}}</div>';
            str += '</div>';
            str += '</fieldset>';
            str += '<fieldset>';
            str += '<legend style="width:70px;">Scaffolds</legend>';
            str += '<div><select class="KFScaffoldMenu" ng-model="scaffoldCurrent" ng-options="s.title for s in scaffolds"></select></div>';
            str += '<div style="height: 20px;"><input type="checkbox" value="Select All" id="scaffoldSelectAll" name="selectAll"> Select All</div>';
            str += '<div ng-repeat="s in scaffoldCurrent.supports"><input type="checkbox" value="{{s._to.title}}" name="scaffolds"> {{s._to.title}}</div>';
            str += '</fieldset>';
            str += '</div>';
            str += '<div class="button_area">';
            str += '<div ng-show="gstatusShow" class="gstatus_area"><img src="manual_assets/kf6images/loading_small.gif"/>Creating your note ...</div><div ng-show="gmsgShow" class="gmsg_area">{{gmsg}}</div><button class="btn btn-primary kfbutton" ng-click="createGoogleDoc(\'' + to + '\')">Create Google Doc</button>';
            str += '</div></div>';
            $('body').append(str);
            $compile($('#googleDoc_dialog').contents())($scope);
            $("#scaffoldSelectAll").change(function () {
                $("input:checkbox[name=scaffolds]").prop('checked', this.checked);
            });
            $('#googleDoc_dialog').dialog({
                width: width,
                height: height,
                create: function () {
                    $(this).css('padding', '1px');
                },
                open: function () {
                    // var iwnd = $(this).parent();
                    // var x = iwnd.offset().left;
                    // var y = iwnd.offset().top;
                    // var offset = frames.length * 20;
                    // iwnd.offset({
                    //     left: x + offset,
                    //     top: y + offset
                    // });
                },
                drag: function () {
                    // _.remove(frames, function(n) {
                    //     return n === wid;
                    // });
                },
                close: function () { /*we need to erase element*/
                    $scope.gmsgShow = false;
                    $scope.gstatusShow = false;
                    $(this).remove();
                }
            });
        };

        $scope.createGoogleDoc = function (fromId) {
            var googleOAuth = $scope.status.googleOAuth;
            if (!googleOAuth) {
                $scope.popupGAuthorizationNotice();
            }
            else {
                //create google document
                var title = $('#gdoc_title').val();
                if (title === undefined || title === null || title.trim() === '') {
                    $scope.gmsgShow = true;
                    $scope.gstatusShow = false;
                    $scope.gmsg = "Title field cannot be left blank.";
                    return;
                }
                $scope.gmsgShow = false;
                $scope.gstatusShow = true;
                var coauthors = "";
                $('input[name="coauthors"]:checked').each(function(){
                    // if($(this).attr("valid") == 'yes'){
                    //     coauthors = coauthors + $(this).val() + ",";
                    // }
                    coauthors = coauthors + $(this).val() + ",";
                });
                if (coauthors !== "") {
                    coauthors = coauthors.substring(0, coauthors.length - 1);
                }
                var scaffolds = "";
                $('input[name="scaffolds"]:checked').each(function () {
                    scaffolds = scaffolds + $(this).val() + ",";
                });
                var dt = {};
                dt.title = title;
                dt.coauthors = coauthors;
                dt.scaffolds = scaffolds;
                dt.userName = $scope.community.author.userName;
                $http.post('/auth/googleFile/create', dt)
                    .success(function(result) {
                        $scope.gmsgShow = false;
                        $scope.gstatusShow = false;
                        $('#googleDoc_dialog').remove();
                        var docId = result.data.docId;
                        var w = null;
                        if ($scope.isMobile()) {
                            w = window.open('');
                        }
                        var mode = {};
                        mode.permission = $scope.contribution.permission;
                        mode.group = $scope.contribution.group;
                        mode.title = title;
                        mode.status = 'active';
                        mode.docId = docId;
                        mode.coauthors = dt.coauthors;
                        mode.createdBy = dt.userName;
                        mode.text4search = '( ' + title + ' )  (  )';
                        $community.createNoteOn(mode, fromId, function(note) {
                            var url = './contribution/' + note._id;
                            window.open(url, '_blank');
                        });

                    }).error(function() {
                });
            }
        };


        $scope.makeFromTemplate = function () {
            var templateBody = $scope.copy.body;
            templateBody = $kftag.processTemplate(templateBody, $scope.toConnections);

            /* here is a copy of making builds on (merge later) */
            var w;
            if ($scope.isMobile()) {
                w = window.open('');
            }
            var mode = {};
            mode.permission = $scope.contribution.permission;
            mode.group = $scope.contribution.group;
            $community.createNote(mode, function (newContribution) {
                var url = './contribution/' + newContribution._id;
                if (w) {
                    w.location.href = url;
                } else if (window.openContribution) {
                    window.openContribution(newContribution._id);
                } else {
                    window.open(url, '_blank');
                }
                /* get context does not work -- need refactoring */
                if (contextId) {
                    $community.getObject(contextId, function (view) {
                        if (view.type === 'View') {
                            $community.getLinksFromTo(view._id, $scope.contribution._id, 'contains', function (links) {
                                if (!links || links.length === 0) {
                                    return;
                                }
                                var link = links[0];
                                var data = { x: link.data.x + 100, y: link.data.y + 100 };
                                $community.createLink(view._id, newContribution._id, 'contains', data, function () {
                                    $community.createLink(newContribution._id, $scope.contribution._id, 'buildson', {}, function () { });
                                });
                            });
                        }
                    });
                }
            }, templateBody);
            /* copy end */
        };

        $scope.makeRiseabove = function () {
            var mode = {};
            mode.permission = $scope.contribution.permission;
            mode.group = $scope.contribution.group;
            $community.createView('riseabove:' + $scope.contribution._id, function (view) {
                var riseabove = {
                    viewId: view._id
                };
                if (!$scope.contribution.data) {
                    $scope.contribution.data = {};
                }
                $scope.contribution.data.riseabove = riseabove;
                $scope.contribute();
                $scope.prepareRiseabove();
            }, true, mode);
        };

        $scope.prepareRiseabove = function () {
            if ($scope.contribution.isRiseabove === undefined) {
                return;
            }
            if ($scope.contribution.isRiseabove()) {
                var url = 'view/' + $scope.contribution.data.riseabove.viewId + '/X';
                var xhtml = '<iframe style="display: block;" height="100%" width="100%" src="%SRC%" ></iframe>';
                xhtml = xhtml.replace('%SRC%', url);
                if (document.getElementById('ctrb_window_' + contributionId) === null) {
                    $('.riseabovediv').html(xhtml);
                }
                else {
                    $('#ctrb_window_' + contributionId + ' .riseabovediv').html(xhtml);
                }
            }
        };

        $scope.openRiseaboveView = function () {
            if (!$scope.contribution.isRiseabove()) {
                window.alert('this contribution is not riseabove');
            }

            var url = 'view/' + $scope.contribution.data.riseabove.viewId;
            window.open(url, '_blank');
        };

        $scope.openAttachPanel = function(inline) {
            $scope.inLineAttachment = inline;
            $scope.status.isAttachmentsCollapsed = !$scope.status.isAttachmentsCollapsed;
        };

        $scope.getFileNameString = function(name) {
            if (name.length < 20) {
                return name;
            } else {
                return name.replace(/^(.{16}).*\.([^.]+)$/, '$1...$2');
            }
        };

        $scope.getFileSizeString = function(size) {
            if (size < 1000 * 1000) { //less than 1MB
                return $filter('number')(Math.round(size /1000)) + ' kB';
            } else if (size < 1000 * 1000 * 1000) { //lest than 1GB
                return $filter('number')(Math.round(size /1000000)) + ' MB';
            } else {
                return $filter('number')(Math.round(size /1000000000)) + ' GB';
            }
        };

        $scope.floor = Math.floor;

        $scope.attachmentUploaded = function(attachment, x, y, dnd) {
            $http.post('/api/links', {
                from: $scope.contribution._id,
                to: attachment._id,
                type: 'attach'
            }).success(function() {
                $scope.updateFromConnections($scope.updateAttachments);
                if ($scope.inLineAttachment) {
                    var data_mce_src = attachment.data.url;
                    var title = attachment.title;
                    var html = '';
                    if ($scope.isImage(attachment)) {
                        if (!dnd) {
                            html = '<img class="inline-attachment ' + attachment._id + '" src="' + data_mce_src +'" width="100px" alt="' + title + '" data-mce-src="' + data_mce_src + '">';
                        }
                    } else {
                        html ='<a class="inline-attachment ' + attachment._id + '" href="' + data_mce_src + '" target="_blank" download>';
                        html += '<img src="/manual_assets/kf6images/03-toolbar-attachment.png" alt="' + title + '">' + title + '</a>';
                    }
                    $scope.insertText(html);
                }

                $timeout(function() {
                    $scope.status.isAttachmentCollapsed = true;
                }, 500);
            });
        };

        $scope.isImage = function (attachment) {
            if (!attachment.data || !attachment.data.type) {
                return false;
            }
            return attachment.data.type.indexOf('image/') === 0;
        };

        $scope.isVideo = function(attachment) {
            if (!attachment.data || !attachment.data.type) {
                return false;
            }
            return attachment.data.type.indexOf('video/') === 0;
        };

        $scope.isVideo = function(attachment) {
            if (!attachment.data || !attachment.data.type) {
                return false;
            }
            return attachment.data.type.indexOf('video/') === 0;
        };

        $scope.isVideo = function (attachment) {
            if (!attachment.data || !attachment.data.type) {
                return false;
            }
            return attachment.data.type.indexOf('video/') === 0;
        };

        $scope.isImageOrVideo = function (attachment) {
            return $scope.isImage(attachment) || $scope.isVideo(attachment);
        };

        /**********************************
         videco code (by Yoshiaki Team)
         **********************************/

        $scope.playVideo = function () {
            var video = document.getElementById("video");
            video.play();
        };

        $scope.pauseVideo = function () {
            var video = document.getElementById("video");
            video.pause();
        };

        var tags = [];
        $scope.initVideo = function () {
            $scope.loadTags();
            window.setTimeout(function () {
                $scope.showComment();
            }, 1000);

            var video = document.getElementById('video');
            var seekbar = document.getElementById('seekbar');
            if (video.readyState > 0) {
                seekbar.max = video.duration;
            } else {
                video.addEventListener('loadedmetadata', function () {
                    seekbar.max = video.duration;
                });
            }
            seekbar.addEventListener('change', function () {
                video.currentTime = seekbar.value;
            }, false);
            video.addEventListener('timeupdate', function () {
                seekbar.value = video.currentTime;
                document.getElementById("playtime").innerHTML = $scope.makeTimeString(video.currentTime);
                $scope.moveComments();
            }, false);
        };

        $scope.moveComments = function () {
            var video = document.getElementById('video');
            var time = video.currentTime;
            var time2 = time + 0.25;
            tags.forEach(function (each) {
                if (time <= each.time && each.time < time2) {
                    //コメント
                    document.getElementById("commentTelop").style.left = 500 + "px";
                    //console.log(document.getElementById("commentTelop").style.left);
                    document.getElementById("commentTelop").innerHTML = each.comment;
                    // document.getElementById("eventTelop").innerHTML = each.event;
                    // var telop = setInterval("moveComment()", 100);
                    var telop = setInterval(function () {
                        var x = parseInt(document.getElementById("commentTelop").style.left);
                        $scope.moveComment();
                        if (x < -500) {
                            document.getElementById("eventTelop").innerHTML = "";
                            clearInterval(telop);
                        }
                    }, 100);
                }
            });
        };

        $scope.postComment = function () {
            var video = document.getElementById('video');
            var comment = document.getElementById("commentBox").value;
            //var event = document.getElementById("eventBox").value;
            var authorId = $community.getAuthor()._id;
            var newid = new Date().getTime();
            tags.push({ id: newid, authorId: authorId, time: video.currentTime, event: event, comment: comment });
            $scope.contribution.data.tags = tags;
            $scope.sendContribute();


            // var video = document.getElementById('video');
            var mode = {};
            mode.permission = $scope.contribution.permission;
            mode.group = $scope.contribution.group;
            $community.createNoteOn(mode, $scope.contribution._id, function (newContribution) {
                var time = video.currentTime;
                var videotime = ("0" + Math.floor(Math.floor(time) / 60)).slice(-2) + ":" + ("0" + Math.floor(time) % 60).slice(-2);
                var hour = Math.floor(Math.floor(time) / 3600);
                if (hour > 0) {
                    videotime = hour + ':' + videotime;
                }
                newContribution.title = videotime + ' ' + comment;

                var html = '<video width="80%" controls src="%SRC%">';
                var src = $scope.contribution.data.url + '#t=' + time;
                html = html.replace('%SRC%', src);
                newContribution.data.body = html;
                newContribution.status = 'active';
                document.getElementById("commentBox").value = "";
                $community.modifyObject(newContribution, function () {
                });
            });

            $scope.showComment();
        };

        $scope.deleteComment = function (commentId) {
            if (commentId) {
                tags = tags.filter(function (each) {
                    return each.id !== commentId;
                });
                $scope.contribution.data.tags = tags;
                $scope.sendContribute();
                $scope.showComment();
            }
        };

        $scope.showComment = function () {
            //並び替え
            tags.sort(function (a, b) {
                return a.time > b.time;
            });
            //表リセット
            var tablecode = '<tr>';
            tablecode += '<th width="60px">Time</th>';
            //tablecode += '<th width="150px">Event</th>';
            tablecode += '<th width="250px">Comment</th>';
            tablecode += '<th width="70px">By</th>';
            tablecode += '<th width="20px"></th>';
            tablecode += '</tr>';
            $('#table').html(tablecode);
            var table = document.getElementById('table');

            //表並び替え
            tags.forEach(function (each) {
                var row = table.insertRow(-1);
                var cell1 = row.insertCell(-1);
                //var cell2 = row.insertCell(-1);
                var cell3 = row.insertCell(-1);
                var cell4 = row.insertCell(-1);
                var cell5 = row.insertCell(-1);
                cell1.innerHTML = '<button ng-click="moveVideo(' + each.time + ')">' + $scope.makeTimeString(each.time) + '</button>';
                //cell2.innerHTML = each.event;
                cell3.innerHTML = each.comment;
                //cell4.innerHTML = '{{getVideoAuthorString(' + each.authorId + ')}}';
                cell4.innerHTML = $scope.getVideoAuthorString(each.authorId);
                cell5.innerHTML = '<button ng-click="deleteComment(' + each.id + ')">x</button>';
            });
            $compile($('#table').contents())($scope);
            document.getElementById("commentBox").value = "";
            //document.getElementById("eventBox").value = "";
        };

        $scope.getVideoAuthorString = function (id) {
            return $community.makeAuthorString([$community.getMember(id)]);
        };

        $scope.makeTimeString = function (time) {
            var str = '';
            var videoSecond = time % 60;
            var videoMinute = time / 60;
            if (videoSecond < 10 && videoMinute < 10) {
                str = "0" + Math.floor(time / 60) + ":" + "0" + Math.floor(time % 60) + ":" + time.toFixed(2).substr(-2);
            } else if (videoSecond >= 10 && videoMinute < 10) {
                str = "0" + Math.floor(time / 60) + ":" + Math.floor(time % 60) + ":" + time.toFixed(2).substr(-2);
            } else if (videoSecond >= 10 && videoMinute < 10) {

            } else if (videoSecond >= 10 && videoMinute >= 10) {
                str = Math.floor(time / 60) + ":" + Math.floor(time % 60) + ":" + time.toFixed(2).substr(-2);
            }
            return str;
        };

        $scope.moveComment = function () {
            var x = parseInt(document.getElementById("commentTelop").style.left);
            document.getElementById("commentTelop").style.left = (x - 15) + "px";
        };

        $scope.moveVideo = function (time) {
            var video = document.getElementById("video");
            video.currentTime = time;
            video.play();
        };

        $scope.loadTags = function () {
            if ($scope.contribution.data.tags) {
                tags = $scope.contribution.data.tags;
            }
        };

        /**********************************
         end of videco code
         **********************************/

        $scope.downloadAttachment = function (attachment) {
            //window.location = attachment.data.url;
            window.open(attachment.data.url);
        };

        $scope.deleteAttachment = function (link) {
            if (window.confirm('Are you sure to delete the attachment?')) {

                $community.deleteLink(link, function() {
                    $scope.updateFromConnections($scope.updateAttachments);
                    var removedElements = $scope.mceEditor.dom.remove($scope.mceEditor.dom.select('.' + link.to));
                    if (removedElements){
                        $scope.copy.body = $scope.mceEditor.getContent();
                    }
                    //$scope.contribute();
                });
                // if (window.confirm('Are you OK to contribute this change?')) {
                //     $community.deleteLink(link, function() {
                //         $scope.contribute();
                //     });
                // }

            }
        };

        /*********** tab changed handler ************/

        $scope.tabSelected = function(idx) {
            if(idx ==='edit'){
                if ($scope.svgInitialized === false && $scope.contribution.type === 'Drawing') {
                    var availScreenheight=window.innerHeight;
                    var xhtml = '';
                    if(availScreenheight<600){
                        var heig=availScreenheight-105;
                        xhtml = '<iframe style="display: block;" id="svgedit" height="'+heig+'" width="100%" src="manual_components/svg-edit-2.8.1/svg-editor.html" onload="onSvgInitialized();"></iframe>';
                    }
                    else{
                        xhtml = '<iframe style="display: block;" id="svgedit" height="400px" width="100%" src="manual_components/svg-edit-2.8.1/svg-editor.html" onload="onSvgInitialized();"></iframe>';
                    }
                    $('#svgeditdiv').html(xhtml);
                    $scope.svgInitialized = true;
                }
            }
            else if(idx ==='authors'){
                $scope.contribution.getGroupName = function() {
                    var groupId = $scope.contribution.group;
                    if (!groupId) {
                        return '(none)';
                    }
                    var group = $scope.community.groups[groupId];
                    if (!group) {
                        return groupId + ' (loading)';
                    }
                    return group.title;
                };
                $scope.selected.group = $community.getGroup($scope.contribution.group);
                $scope.$watch('selected.group', function() {
                    if ($scope.selected.group) {
                        $scope.contribution.group = $scope.selected.group._id;
                    }
                    else if($scope.selected.group === null){
                        $scope.contribution.group = null;
                        $scope.contribution._groupMembers = null;
                    }

                });
                $community.refreshGroups();
                $community.refreshMembers();
                $scope.communityMembers = $community.getMembersArray();
            }
            else if(idx ==='connections'){

            }
            else if(idx ==='history'){
                $scope.updateRecords();
            }
            else if(idx ==='attachments'){

            }
            else if(idx ==='read'){
                $scope.status.hidebuildson = false;
            }

        };


        $scope.readDeselected = function() {
            $scope.status.hidebuildson = true;
        };

        $scope.promisingIdeaSelected = function() {
            $scope.status.hidecontributeButtonBar = true;
        };

        $scope.promisingIdeaDeselected = function() {
            $scope.status.hidecontributeButtonBar = false;
        };

        /*********** title ************/

        $scope.updateTitle = function() {
            if (window.setInternalWindowTitle) { //Internal
                if ($scope.contribution.type === 'View') {
                    window.setInternalWindowTitle('View Property');
                } else {
                    //Susana doesnt like to put title here.
                }
            } else { //External
                var title = '*';
                title = $scope.contribution.type + ': ' + $scope.contribution.title;
                document.title = title;
            }
        };

        $scope.imgDragStart = function(e){
            var maxWidth = 200;
            var dt = e.dataTransfer;
            var img = e.target;
            var width = img.naturalWidth;
            if(width > maxWidth){
                width = maxWidth;
            }
            var data_mce_src = img.getAttribute("src");
            var html = '<img class="inline-attachment ' + img.getAttribute('class') + '" src="' + data_mce_src + '" width="' + width + 'px" alt="" data-mce-src="' + data_mce_src + '">';
            dt.setData('text/html', html);
        };

        $scope.fileDragStart = function(e){
            var dt = e.dataTransfer;
            var file = e.target;
            var data_mce_src = file.parentNode.getAttribute("href");
            var title = file.getAttribute('title');
            var html ='<a class="inline-attachment ' + file.getAttribute('class') + '" href="' + data_mce_src + '" target="_blank" download>';
            html += '<img src="/manual_assets/kf6images/03-toolbar-attachment.png" alt="' + title + '">' + title + '</a>';
            dt.setData('text/html', html);
        };

        /*********** DnD Reference Related ************/
        $scope.kfdragstart = function(e) {
            var dt = e.dataTransfer; //error in IE
            if (!dt && $kfutil.isIE()) {
                window.alert('Sorry, making reference function doesn\'t work on IE');
                return; //surrender to create reference
            }
            var original = dt.getData('text/plain');
            if (!original && $kfutil.isSafari()) {
                original = getSelected();
            }
            var contrib = $scope.contribution;
            var html = $kftag.createNewReferenceTag(contrib._id, contrib.title, contrib.authors, original);
            dt.setData('kf', 'true');
            dt.setData('kfid', $scope.contribution._id);
            dt.setData('text/html', html);
            dt.setData('text/plain', original);
        };
        $scope.kfcopy = function(e) {
            var dt = e.clipboardData; //error in IE
            if (!dt && $kfutil.isIE()) {
                window.alert('Sorry, making reference function doesn\'t work on IE');
                return; //surrender to create reference
            }
            var original = getSelected();
            var contrib = $scope.contribution;
            var html = $kftag.createNewReferenceTag(contrib._id, contrib.title, contrib.authors, original);

            if ($kfutil.isiOS()) {//added by Yoshiaki for ios
                $kfutil.copyClipboardOniOS(html);
                return;
            }

            dt.setData('kf', 'true');
            dt.setData('kfid', $scope.contribution._id);
            dt.setData('text/html', html);
            dt.setData('text/plain', original);
            e.stopPropagation();
            e.preventDefault();
        };

        //http://stackoverflow.com/questions/5643635/how-to-get-selected-html-text-with-javascript
        function getSelected() {
            var text = '';
            if ($scope.status.edittabActive && tinymce.activeEditor.selection) {
                return tinymce.activeEditor.selection.getContent();
            } else if (window.getSelection && window.getSelection().toString() && $(window.getSelection()).attr('type') !== 'Caret') {
                text = window.getSelection().toString();
                return text;
            } else if (document.getSelection && document.getSelection().toString() && $(document.getSelection()).attr('type') !== 'Caret') {
                text = window.getSelection().toString();
                return text;
            } else {
                var selection = document.selection && document.selection.createRange();
                if ((typeof selection !== 'undefined') && selection.text && selection.text.toString()) {
                    text = selection.text;
                    return text;
                }
            }
            return false;
        }

        /*********** tinymce ************/
        $scope.mcesetupHandler = function(ed) {
            $scope.mceEditor = ed;
            $scope.mceResize();

            ed.on('load', function () {
                ed.schema.addValidElements( "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]");
            });
            ed.on('dragover', function(e) {
                // important to keep caret
                // this was workable 4.0.0 but cannot keep caret on 4.1.7
                e.preventDefault();
                e.stopPropagation();
                ed.focus();
            });
            ed.on('dragstart', $scope.kfdragstart);
            ed.on('copy', $scope.kfcopy);
        };

        $scope.mceResize = function() {
            if ($scope.mceEditor) {
                var height = 0;
                if($scope.isMobile()){
                    var h1 = $('div[class="KFTabSet"]').height();
                    //var h2 = $('ul[class="nav nav-tabs"]').height();
                    var h2 = 38;
                    //var h3 = $('div[class~="mce-toolbar-grp"]').height();
                    var h3 = 130;
                    //h3 = h3 === 196? 100 : h3;
                    height = h1 - h2 - 90 - h3 ;
                }
                else{
                    height = $('#ctrb_window_'+contributionId).height();
                    if(height === null){
                        height = window.innerHeight;
                        height = height - 200;
                    }
                    else{
                        height = height - 210;
                    }
                }
                $scope.mceEditor.theme.resizeTo('100%', height);
            }
        };

        $('#ctrb_window_'+contributionId).bind( "dialogresize", function(event, ui) {
            $scope.mceResize();
        });

        var currentLang = $translate.proposedLanguage() || $translate.use();
        var languageURL = "";
        if (currentLang === 'en') {
            languageURL = "";
        } else {
            languageURL = "/manual_components/tinymce-langs/" + currentLang + ".js";
        }

        $scope.dropImage = function(blobInfo, success, failure) {
            var file = blobInfo.blob();
            $community.createAttachment(function(attachment) {
                var userName = $scope.community.author.userName;
                $scope.upload = $upload.upload({
                    url: 'api/upload',
                    method: 'POST',
                    file: file
                })
                    .progress(function(evt) {
                        var percent = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.progress = percent;
                    }).success(function(data) {
                        attachment.title = data.filename;
                        attachment.status = 'active';
                        data.version = attachment.data.version + 1;
                        attachment.data = data;
                        attachment.tmpFilename = data.tmpFilename;
                        $community.modifyObject(attachment, function(newAttachment) {
                            newAttachment.data.width = file.width;
                            newAttachment.data.height = file.height;
                            $scope.attachmentUploaded(newAttachment, 0, 0, true);
                            if (success) {
                                success(newAttachment.data.url);
                            }
                        });
                    }).error(function( /*data, status*/ ) {
                        window.alert('error on uploading');
                        if (failure) {
                            failure('error on uploading');
                        }
                    });
            });
        };


        $scope.tinymceOptions = {
            language: currentLang,
            language_url: languageURL,
            theme: 'modern',
            menubar: false,
            elementpath: false,
            theme_advanced_path : false,
            statusbar: false,
            convert_urls: false,
            paste_preprocess: function (pl, o) {

                //paste normally if its copy paste from the note
                if (o.content.indexOf($scope.contribution._id) !== -1) {
                    var jq = $('<div>' + o.content + '</div>');
                    var span = jq.find('.KFReferenceText');
                    o.content = span.text();
                }

                if ($kfutil.isiOS()) {
                    var str = o.content;
                    str = str.replace(/&lt;/g, '<');
                    str = str.replace(/&gt;/g, '>');
                    str = str.replace(/&quot;/g, '"');
                    str = str.replace(/&#39;/g, '\'');
                    str = str.replace(/&amp;/g, '&');
                    o.content = str;
                }
            },
            //directionality: 'rtl',
            // TODO decide if internationalize or remove font size
            /*
            style_formats_merge: true,
            style_formats: [{
                title: 'Font Size',
                items: [{
                    title: '8pt',
                    inline: 'span',
                    styles: {
                        fontSize: '12px',
                        'font-size': '8px'
                    }
                }, {
                    title: '10pt',
                    inline: 'span',
                    styles: {
                        fontSize: '12px',
                        'font-size': '10px'
                    }
                }, {
                    title: '12pt',
                    inline: 'span',
                    styles: {
                        fontSize: '12px',
                        'font-size': '12px'
                    }
                }, {
                    title: '14pt',
                    inline: 'span',
                    styles: {
                        fontSize: '12px',
                        'font-size': '14px'
                    }
                }, {
                    title: '16pt',
                    inline: 'span',
                    styles: {
                        fontSize: '12px',
                        'font-size': '16px'
                    }
                }]
            }], */
            plugins: ['advlist autolink autosave link image lists charmap print preview hr anchor pagebreak spellchecker searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking table directionality emoticons template textcolor paste textcolor noneditable fullpage drawingTool wordcount'],
            toolbar: 'styleselect | bold italic underline strikethrough | forecolor backcolor bullist numlist | link code | ltr rtl | charmap | drawingTool | wordcount',
            //toolbar: 'undo redo formatselect fontselect fontsizeselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | forecolor backcolor bullist numlist link image code',
            //toolbar1: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
            //toolbar2: 'forecolor backcolor | emotions link unlink image media | code | styleselect fontselect fontsizeselect',
            //forced_root_block: false, // Have to disable for RTL to work
            force_br_newlines: false,
            force_p_newlines: true,
            toolbar_items_size: 'small',
            content_css: '/manual_assets/kfmce.css',
            inline_styles: true,
            paste_data_images: true,
            images_upload_handler: $scope.dropImage,
            //setup: function(ed){}// dont use this, angular plugin use this.
            init_instance_callback: $scope.mcesetupHandler
        };

        $scope.insertText = function(text) {
            if (!$scope.mceEditor) {
                window.alert('$scope.mceEditor is not set.');
                return;
            }
            $scope.mceEditor.insertContent(text);
        };

        /* supportLink means a contains link from Scaffold to Support */
        $scope.addSupport = function(supportLink, selection, addhyphen, argInitialText, isTemplate) {
            var oldEditor = $scope.mceEditor;

            if (!$scope.mceEditor) {
                window.alert('$scope.mceEditor is not set.');
                return;
            }
            console.log("AA",$community.annotatorEditorId);

            if($community.annotatorEditorId !== null){

                $scope.mceEditor = tinymce.get($community.annotatorEditorId);
            }

            // choose text
            var initialText = '';
            if (argInitialText) {
                initialText = argInitialText;
            }
            var selected = $scope.mceEditor.selection.getContent();
            if (selected.length > 0) {
                initialText = selected;
            }
            // content tag for text selection after insert
            var supportContentId = new Date().getTime().toString();
            var contentTagStr = '<span id="' + supportContentId + '"></span>';

            var text = contentTagStr + initialText;
            if (addhyphen) {
                text = ' -&nbsp;' + text + '&nbsp;- ';
            }

            // insert
            var id = supportLink.to;
            var title = supportLink._to.title;
            var tag = $kftag.createNewScaffoldTag(id, title, text, isTemplate);
            $scope.mceEditor.insertContent(tag);

            // select text after insert
            if (selection) {
                var contentTag = $scope.mceEditor.dom.get(supportContentId);
                if (contentTag) {
                    $scope.mceEditor.selection.setCursorLocation(contentTag);
                }
            }

            $scope.mceEditor = oldEditor;
        };

        $scope.addKeyword = function() {
            if (!$scope.mceEditor) {
                window.alert('$scope.mceEditor is not set.');
                return;
            }

            var selectedText = $scope.mceEditor.selection.getContent();
            if (!selectedText) {
                window.alert('Vous devez sélectionner le (s) mot (s) dans l\'éditeur.');
                return;
            }

            var original = $scope.copy.keywords;
            if (original && original.length >= 0) {
                original += '; ';
            }
            $scope.copy.keywords = original + selectedText;
        };

        $scope.selectedImg = function(event){
            if($scope.images.length === 0){
                return;
            }
            //event = event || window.event;
            var selectedImg = event.target || event.srcElement;
            if(!selectedImg.classList.contains("selected")){
                selectedImg.classList.add("selected");
                $scope.status.insertable = true;
            }
            else{
                selectedImg.classList.remove("selected");
                var parentDOM = document.getElementById("attachment-container");
                var selectedImgs = parentDOM.getElementsByClassName("selected");
                if (selectedImgs.length === 0) {
                    $scope.status.insertable = false;
                }
            }
        };

        /*********** annotator ***********/
        var annotator;
        $scope.annotatorHandler = {};
        $scope.annos = {};
        $scope.annoLinks = {};
        $scope.annotatorHandler.annotatorInitialized = function (anAnnotator) {
            annotator = anAnnotator;
        };

        $scope.annotatorHandler.annotationCreated = function (annoVM) {
            createAnnotation(annoVM);
        };
        $scope.annotatorHandler.annotationUpdated = function (annoVM) {
            if (!annoVM.linkId || !annoVM.modelId) {
                console.error('ERROR! annoVM doesn\'t have id on update');
                return;
            }
            var model = $scope.annos[annoVM.modelId];
            if (!model) {
                console.error('ERROR! model couldn\'t find');
                return;
            }
            model.data = annoVM;
            vm2m(model);
            $community.modifyObject(model);
        };
        $scope.annotatorHandler.annotationDeleted = function (annoVM) {
            if (!annoVM.linkId || !annoVM.modelId) {
                console.error('ERROR! annoVM doesn\'t have id on delete');
                return;
            }
            $http.delete('/api/links/' + annoVM.linkId);
        };

        $scope.annotatorHandler.displayEditor = function (editor, annoVM) {
            if (!editor.element.hasClass(editor.classes.invert.y)) {
                editor.element.addClass(editor.classes.invert.y);
            }
        };

        $scope.annotatorHandler.displayViewer = function (viewer, annoVM) {
            viewer.element.addClass(viewer.classes.invert.y);
        };

        $scope.updateAnnotations = function () {
            if ($scope.contribution.type !== 'Note') {
                return;
            }
            if (!annotator) {
                console.error('annotator was not initialized');
                return;
            }
            window.setTimeout(function () {
                var annoLinks = $scope.toConnections.filter(function (each) {
                    return each.type === 'annotates';
                });
                annoLinks.forEach(function (annoLink) {
                    if (!$ac.isReadable(annoLink._from)) {
                        return;
                    }
                    $community.getObject(annoLink.from, function (anno) {
                        m2vm(anno);
                        $scope.annoLinks[annoLink._id] = annoLink;
                        $scope.annos[anno._id] = anno;
                        var annoVM = anno.data;
                        annoVM.linkId = annoLink._id;
                        annoVM.modelId = anno._id;
                        annotator.loadAnnotations([annoVM]);
                    });
                });
            }, 1000);
        };

        var createAnnotation = function (annoVM) {
            var communityId = $community.getCommunityData().community._id;
            var newobj = {
                communityId: communityId,
                type: 'Annotation',
                title: 'an Annotation',
                authors: [$community.getAuthor()._id],
                status: 'active',
                permission: 'private',
                data: annoVM
            };
            vm2m(newobj);
            $http.post('/api/contributions/' + communityId, newobj)
                .success(function (annotation) {
                    createAnnotationLink(annotation, annoVM);
                });
        };

        var vm2m = function (anno) {
            var isPublic = anno.data.permissions.read.length === 0;
            if (isPublic) {
                anno.permission = 'protected';
            } else {
                anno.permission = 'private';
            }
            var loc = anno.data.ranges[0];
            if (loc.start.indexOf('/div[1]') === 0) {
                loc.start = loc.start.substring(7);
            }
            if (loc.end.indexOf('/div[1]') === 0) {
                loc.end = loc.end.substring(7);
            }
            return anno;
        };

        var m2vm = function (anno) {
            var loc = anno.data.ranges[0];
            loc.start = '/div[1]' + loc.start;
            loc.end = '/div[1]' + loc.end;
            return anno;
        };

        var createAnnotationLink = function (annotation, annoVM) {
            var link = {};
            link.to = $scope.contribution._id;
            link.from = annotation._id;
            link.type = 'annotates';
            $http.post('/api/links', link).success(function (link) {
                annoVM.linkId = link._id;
                annoVM.modelId = annotation._id;
                $scope.annoLinks[link._id] = link;
                $scope.annos[annotation._id] = annotation;
            });
        };

        /*********** svg-edit ************/
        $scope.svgInitialized = false;

        $scope.tabSelected = function (idx) {
            if (idx === 'edit') {
                if ($scope.svgInitialized === false && $scope.contribution.type === 'Drawing') {
                    var availScreenheight=window.innerHeight;
                    var xhtml = '';
                    if(availScreenheight<600){
                        //ADJUSTING iframeheight=Tab-height-heightofTabHeaderAndFooter
                        var heig=availScreenheight*0.9-105;
                        xhtml = '<iframe style="display: block;" id="svgedit" height="'+heig+'" width="100%" src="manual_components/svg-edit-2.8.1/svg-editor.html" onload="onSvgInitialized();"></iframe>';
                    }
                    else{
                        xhtml = '<iframe style="display: block;" id="svgedit" height="400px" width="100%" src="manual_components/svg-edit-2.8.1/svg-editor.html" onload="onSvgInitialized();"></iframe>';
                    }

                    //var xhtml = '<iframe style="display: block;" id="svgedit" height="400px" width="100%" src="manual_components/svg-edit-2.8.1/svg-editor.html" onload="onSvgInitialized();"></iframe>';
                    $('#svgeditdiv').html(xhtml);
                    $scope.svgInitialized = true;
                    if($scope.isMobile()){
                        $('div[class="tab-content"]').css("height","calc(100% - 38px)");
                        ///fixing div in ipad for stopping moving of editor in ipad
                        $('div#svgeditdiv').css("position","fixed");
                        $('div#svgeditdiv').css("width","100%");
                    }
                    else{
                        $('div[class="tab-content"]').has('div#svgeditdiv').css("height","100%");
                    }
                }
            }
            else if (idx === 'authors') {
                $scope.contribution.getGroupName = function () {
                    var groupId = $scope.contribution.group;
                    if (!groupId) {
                        return '(none)';
                    }
                    var group = $scope.community.groups[groupId];
                    if (!group) {
                        return groupId + ' (loading)';
                    }
                    return group.title;
                };
                $scope.selected.group = $community.getGroup($scope.contribution.group);
                $scope.$watch('selected.group', function () {
                    if ($scope.selected.group) {
                        $scope.contribution.group = $scope.selected.group._id;
                    }
                    else if($scope.selected.group === null){
                        $scope.contribution.group = null;
                        $scope.contribution._groupMembers = null;
                    }
                });
                $community.refreshGroups();
                $community.refreshMembers();
                $scope.communityMembers = $community.getMembersArray();
            }
            else if (idx === 'connections') {

            }
            else if (idx === 'history') {
                $scope.updateRecords();
            }
            else if (idx === 'attachments') {

            }
            else if (idx === 'read') {
                $scope.status.hidebuildson = false;
                if ($scope.isMobile()) {
                    $('div[class="tab-content"]').css("height", "calc(100% - 38px)");
                }
                else {
                    $('div[class="tab-content"]').css("height", "calc(100% - 12px)");
                }
            }

        };

        /***********promising Idea's code start ************/
        $scope.setIndex = function (index) {
            $scope.selectedIndex = index;
        };

        $scope.setnewnoteIndex = function (index) {
            $community.refreshViews();
            $scope.newnoteIndex = index;
        };

        $scope.setnewnoteInfo = function (idea) {
            $scope.promisingnoteTitle = 'PI Pool';
            $('button.create').html('Create');
            $scope.currentPI = idea;
        };

        $scope.promisingIdeaobjProcess = function () {
            $scope.promisingIdeaobj = {
                idea: $scope.selectedText,
                reason: $scope.obj.textareaText,
                color: $scope.obj.targetColor
            };
            $suresh.createPromisngIdeaobj($community, $scope.promisingIdeaobj, $scope.contribution._id, function (link, promisingIdeaobj) {
                $scope.promisingIdeaobjLinks[link._id] = link;
                $scope.promisingIdeaobjs[promisingIdeaobj._id] = promisingIdeaobj;
                $scope.toConnections.push(link);
                $scope.status.ispromisingideaTabDisplayed = true;
            });
            $scope.obj.textareaText = '';
            $scope.obj.targetColor = '';
            $scope.selectedText = '';
        };


        $scope.promisingIdeaobjProcessCancel = function () {
            $scope.obj.textareaText = '';
            $scope.obj.targetColor = '';
            $scope.selectedText = '';
            $scope.status.ispromisingideaCollapsed = true;
            $scope.status.hidecontributeButtonBar = false;
        };

        $scope.trustAsHtml = function (html) {
            if (typeof html !== 'string') {
                return html;
            }
            return $sce.trustAsHtml(html);
        };

        $scope.setSelectedText = function (event) {
            $scope.selectedText = $sureshshared.getSelectionText();
            setPromisingIconPos(event);
        };

        function setPromisingIconPos(event) {
            var rect = event.currentTarget.getBoundingClientRect(),
                offsetX = event.clientX - rect.left,
                offsetY = event.clientY - rect.top;
            if (offsetY < 60) {
                offsetX += 40;
                offsetY = 75;
            }
            $scope.promisingobj = {
                "left": offsetX + 20 + "px",
                "top": offsetY - 48 + "px",
                "position": "absolute",
                "z-index": "100"
            };
        }

        $scope.$watch('selectedText', function () {
            if ($scope.selectedText !== '') {
                $(document).ready(function () {
                    var $element = $('div.annotator-adder');
                    $element.attr('title', 'Annotation');
                    $element.addClass('tooltip1');
                    $element.append('<span class=\"tooltiptext\">Annotation</span>');
                    $('button.promisingbtn').show();
                    $element.click(function () {
                        $('button.promisingbtn').hide();
                    });
                });

            }
        });
        $scope.promisingIdeaobjUpdated = function (promisingIdeaobjLink) {
            $suresh.promisingIdeaobjUpdated(promisingIdeaobjLink, $community, $scope.promisingIdeaobjs);
        };

        $scope.promisingIdeaobjDeleted = function (promisingIdeaobjLink) {
            $suresh.promisingIdeaobjDeleted(promisingIdeaobjLink);
        };

        $scope.updatepromisingIdeaobjs = function () {
            if ($scope.contribution.type !== 'Note') {
                return;
            }
            //   window.setTimeout(function() {
            var promisingIdeaobjLinks = $scope.toConnections.filter(function (each) {
                return each.type === 'promisings';
            });
            promisingIdeaobjLinks.forEach(function (promisingIdeaobjLink) {
                if (!$ac.isReadable(promisingIdeaobjLink._from)) {
                    return;
                }
                $community.getObject(promisingIdeaobjLink.from, function (promisingIdeaobj) {
                    $scope.promisingIdeaobjLinks[promisingIdeaobjLink._id] = promisingIdeaobjLink;
                    $scope.promisingIdeaobjs[promisingIdeaobj._id] = promisingIdeaobj;
                    $scope.status.ispromisingideaTabDisplayed = true;
                });
            });
            //  }, 1000);
        };

        $scope.viewSelected = function (view) {
            if ($scope.promisingnoteTitle === '') {
                window.alert('Note title is empty ');
                return;
            }
            $scope.selectedViewIds.push(view._id);
            $timeout(function() {
                $scope.makepromisingnote($scope.promisingnoteTitle,$scope.currentPI);
            }, 500);
        };

        $scope.makepromisingnote = function (title, body) {
            body = $kftag.createNewReferenceTag($scope.contribution._id, $scope.contribution.title, $scope.contribution.authors, body);
            $suresh.createnewnoteInMutipleView(title, $scope.selectedViewIds, $community, body, true);
            $scope.selectedViewIds.length = 0;
            $scope.setnewnoteIndex(-1);
        };

        $scope.showPromisingIdeasInReadMode = function () {
            $scope.promisingmsg = 'Afficher le texte en surbrillance';
            $scope.showpromisingideaColour = !$scope.showpromisingideaColour;
            var markInstance = new window.Mark(document.querySelector("div.promising"));
            markInstance.unmark({
                done: function () {}
            });
            if ($scope.showpromisingideaColour) {
                $scope.promisingmsg = 'Masquer le texte en surbrillance';
                $scope.toConnections.forEach(function (conn) {
                    if (conn.type === 'promisings') {
                        var promisingIdea = conn.data.idea;
                        var color = $scope.promisingIdeaobjs[conn.from].data.color;
                        var searchVal = promisingIdea;
                        markInstance.mark(searchVal, {
                            "className": conn.from,
                            "separateWordSearch": false,
                            "acrossElements": true,
                            "diacritics":false,
                            "debug":false,
                            done: function () {}
                        });
                        if (color !== '') {
                            $("." + conn.from).css({
                                "backgroundColor": color,
                                "color": "black",
                                "font-weight": "bold",
                                "border": "1px solid #000000"
                            });
                        } else {
                            $("." + conn.from).css({
                                "backgroundColor": "white",
                                "color": "black",
                                "font-weight": "bold",
                                "border": "1px solid #000000"
                            });
                        }
                        $("." + conn.from).attr('title', 'Idée prometteuse - Par '+$scope.getPromisingIdeaCreator($scope.promisingIdeaobjs[conn.from].authors) +" "+ $scope.getPromisingIdeaCreated($scope.promisingIdeaobjs[conn.from].modified));
                    }
                });
            }
            $scope.selectedText = '';
            $(document).ready(function () {
                var $element = $('div.annotator-adder');
                $element.hide();
            });
        };

        $scope.setPromisingColorData = function () {
            var colordata = '', cid = '', cobj = {};
            $scope.promisingColorData.length = 0;
            $suresh.promisingcolors().forEach(function (promisingcolor, index) {
                cid = 'none';
                colordata = "";
                $scope.promisingIdeacolorobjsarr.forEach(function (pcolorobj) {
                    if (pcolorobj.data.color === promisingcolor) {
                        colordata = pcolorobj.data.data;
                        cid = pcolorobj._id;
                        cobj = pcolorobj;
                    }
                });
                $scope.promisingColorData.push({
                    color: promisingcolor,
                    data: colordata,
                    id: cid,
                    obj: cobj
                });
            });
        };

        $scope.clearColor = function () {
            $scope.obj.targetColor = '';
            return $scope.obj.targetColor;
        };

        $scope.getPromisingIdeacolorobjupdatemsg = function (promisingcolor) {
            $scope.updatemsg = getPromisingIdeacolorobjmsg(promisingcolor);
            return $scope.updatemsg;
        };

        var setPromisingIdeacolorobjcreatemsg = function (promisingcolor) {
            $scope.createmsg = getPromisingIdeacolorobjmsg(promisingcolor);
        };

        var getPromisingIdeacolorobjmsg = function (promisingcolor) {
            var msg = ' (Non attribué)';
            if(promisingcolor!==undefined){
                msg = promisingcolor.charAt(0).toUpperCase() + promisingcolor.slice(1) +' (Non attribué)';
            }
            $scope.promisingIdeacolorobjsarr.forEach(function (pcolorobj) {
                var promisngcolorgroup = pcolorobj.data.data;
                if(promisngcolorgroup===''){
                    promisngcolorgroup = 'Non attribué';
                }
                if (pcolorobj.data.color === promisingcolor) {
                    msg =promisingcolor.charAt(0).toUpperCase() + promisingcolor.slice(1) + ' (' + promisngcolorgroup + ')';
                    return msg;
                }
            });
            return msg;
        };

        $scope.$watch('obj.targetColor', function () {
            setPromisingIdeacolorobjcreatemsg($scope.obj.targetColor);
        });

        $scope.savePromisingIdeacolorobj = function (pcolordata, pcolor, id, promingcolorobj) {
            if (id === 'none') {
                $scope.promisingIdeacolorobj = {
                    color: pcolor,
                    data: pcolordata
                };
                $community.createPromisingcolorobj($scope.promisingIdeacolorobj, function () {});
            } else {
                promingcolorobj.data = {
                    color: promingcolorobj.data.color,
                    data: pcolordata
                };
                $community.modifyObject(promingcolorobj, function () {
                    $community.refreshPromisingcolorobjs(function () {
                        $scope.promisingIdeacolorobjsarr = $community.getPromisingcolorobjsArray();
                    });
                });
            }
        };

        $scope.getPromisingIdeaCreator = function (authorId) {
            return $community.getMember(authorId).getName();
        };

        $scope.getPromisingIdeaCreated = function (created) {
            return new Date(created).toLocaleString();
        };

        $scope.isPromisingIdeaCreator = function (authorId) {
            return $community.getAuthor()._id===authorId+'';
        };

        $scope.clearSelection=function() {
            $sureshshared.clearSelection();
        };

        $scope.hasSubString=function(subString) {
            var fullString = $('div.promising').text();
            var has =$sureshshared.hasSubString(fullString, subString) ;
            $scope.status.ispromisingideaTabDisplayed = true;
            if(has){
                $scope.haspromisingidea = true;
            }
            return has;
        };

        function getPromisingcolours() {
            var colors = [];
            colors.push('');
            if($scope.context && $scope.context.data && $scope.context.data.plugins) {

                if($scope.context.data.plugins.yellow===true){
                    colors.push('yellow');
                }
                if($scope.context.data.plugins.pink===true){
                    colors.push('pink');
                }
                if($scope.context.data.plugins.green===true){
                    colors.push('green');
                }
                if($scope.context.data.plugins.violet===true){
                    colors.push('violet');
                }
                if($scope.context.data.plugins.purple===true){
                    colors.push('purple');
                }
                if($scope.context.data.plugins.orange===true){
                    colors.push('orange');
                }
                if($scope.context.data.plugins.red===true){
                    colors.push('red');                }
                if($scope.context.data.plugins.blue===true){
                    colors.push('blue');
                }
            }
            return colors;
        }

        /*********** Promisingness Idea's code End  ************/



    });
function cleanContributionBody(str) {

    str = str.replace(/(\r\n|\n|\r)/gm,"");
    str = str.replace(/[^a-zA-Z0-9 ]/g, '');
    str = str.replace(/\s+/g, '')
    return str
}

function onSvgInitialized() {
    var wnd = document.getElementById('svgedit').contentWindow;
    var doc = wnd.document;

    //var svg = '<svg width="100%" height="100%" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><g><title>Layer 1<\/title><rect stroke-width="5" stroke="#000000" fill="#FF0000" id="svg_1" height="35" width="51" y="35" x="32"/><ellipse ry="15" rx="24" stroke-width="5" stroke="#000000" fill="#0000ff" id="svg_2" cy="60" cx="66"/><\/g><\/svg>';
    var svg = '';
    if (window.contribution) {
        svg = window.contribution.data.svg;
    }

    wnd.svgCanvas.setSvgString(svg);

    var d1=doc.getElementById("svgcanvas"),
        style = window.getComputedStyle(d1),
        w=style.getPropertyValue('width'),
        h=style.getPropertyValue('height');

    if(svg !=='<svg width="200" height="200" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><g><title>Layer 1</title></g></svg>'){
        wnd.svgCanvas.setResolution(w, h);
        wnd.svgCanvas.selectAllInCurrentLayer();
        wnd.svgCanvas.groupSelectedElements();
        wnd.svgCanvas.alignSelectedElements('m','page');
        wnd.svgCanvas.alignSelectedElements('c','page');
        wnd.svgCanvas.ungroupSelectedElement();
        wnd.svgCanvas.clearSelection();
    }
    else{
        var p= doc.getElementById('svgcontent');
        var p1=p.childNodes[1];
        p1.children[1].setAttribute('width', w);
        p1.children[1].setAttribute('height', h);
        wnd.svgCanvas.setResolution(w, h);
    }
    //wnd.svgEditor.showSaveWarning = false;
}





angular.module('kf6App')
    .controller('NoteTranslatorCtrl', function($scope, $modalInstance,noteText,$http) {
        $scope.translatedNoteText="";
        if(noteText){
            $scope.translatedNoteText=noteText;
        }
        else{
            $scope.cancel();
        }
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };

    });
