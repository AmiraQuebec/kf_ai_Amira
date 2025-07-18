/* global d3 */
'use strict';

angular.module('kf6App')
    .controller('StudentdictionaryCtrl', function ($scope, $stateParams, $http) {
        $scope.authors = [];
        $scope.notes = [];
        $scope.authorNotesMap = {};
        $scope.authorwords = [];
        $scope.phraseWords=[];
        $scope.authorKeyconcepts=[];
        $scope.noWords = false;
        $scope.phrases = ['Penser vite et lentement', 'Auto-organisation', 'Émergence', 'Bord du chaos', 'La pensée de conception', 'Création de connaissances', 'État d\'esprit centralisé',
            'Cohérence explicative', 'De vraies idées, des problèmes authentiques', 'Idées améliorables', 'Diversité des idées', 'Élever-le-propos', 'Agence épistémique', 'Responsabilité collective pour les connaissances communautaires', 'Démocratiser la connaissance', 'Progression symétrique des connaissances', 'Renforcement des connaissances omniprésentes', 'Utilisations constructives de sources faisant autorité', 'Discours de renforcement des connaissances', 'EÉvaluation intégrée, simultanée et transformative', 'Société de connaissance'
        ];

        $('[data-toggle="tooltipkeyconcept"]').tooltip();

        if ($stateParams.communityId) {

            $http.get('/api/contributions/' + $stateParams.communityId + '/studentNotes').success(function (data) {
                $scope.authors = data.authors;
                $scope.notes = data.contributions;
                var tempAuthor;
                $scope.authors.forEach( function(author) {
                    tempAuthor = {};
                    if (author.status === "active" ) {
                        tempAuthor.name = author.firstName + author.lastName;
                        tempAuthor.wordString = "";
                        tempAuthor.userId = author.userId;
                        tempAuthor.notes=[];
                        $scope.authorNotesMap[author._id] = tempAuthor;
                    }
                });

                var plainNoteData;
                $scope.notes.forEach(function(note) {
                    if (note.authors && note.authors.length) {
                        for (var i = 0; i < note.authors.length; i++) {
                            if ($scope.authorNotesMap[note.authors[i]] && note.data && note.data.body) {
                                plainNoteData=html2PlainText(note.data.body);
                                note.plainNoteData=plainNoteData;
                                $scope.authorNotesMap[note.authors[i]].notes.push(note);
                                $scope.authorNotesMap[note.authors[i]].wordString += html2PlainText(note.data.body);
                            }
                        }
                    }
                });
                for (var key in $scope.authorNotesMap) {
                    if ($scope.authorNotesMap.hasOwnProperty(key)) {
                        $scope.authorNotesMap[key].wordCounts = $scope.createWords($scope.authorNotesMap[key].wordString);
                        $scope.authorNotesMap[key].phraseCounts=$scope.phraseCount($scope.authorNotesMap[key].wordString);
                        $scope.authorNotesMap[key].keyConceptsClassified=$scope.keyConceptClassifier($scope.authorNotesMap[key].notes);
                    }
                }
            }).error(function () {
                window.alert("Error in Fetching the notes,Please try later.");
            });
        }
        //converts to plain text ,removes special symbols
        function html2PlainText(html) {
            var text = "";
            if (html.trim() === "") {
                return text;
            }
            console.log(html)
            html = html.replace(/&nbsp;/g, "");
            html = html.replace(/<span([^>]*)class="KFSupportStart mceNonEditable"([^>]*)>/g, "[");
            html = html.replace(/<span\s*([^>]*)\s*class="KFSupportEnd mceNonEditable"\s*([^>]*)>/g, "]");
            html = html.replace(/<span class="katex">/g, "");
            html = html.replace(/<input type="hidden"\s*([^>]*)\s*value="(.*?)"\s*([^>]*)>/gi, "Equation -> $2<br>");
            html = html.replace(/<span class="katex-html"[^>]*>(.(?!<label>))*<\/span><label><\/label>/g, "");
            html = html.replace(/<\/?span[^>]*>/g, "");
            html = html.replace(/<\/?em[^>]*>/g, "");
            html = html.replace(/<\/?strong[^>]*>/g, "");
            html = html.replace(/<\/?div[^>]*>/g, "");
            html = html.replace(/<\/?h[1-9][^>]*>/g, "");
            html = html.replace(/<\/?ul[^>]*>/g, "");
            html = html.replace(/<\/?ol[^>]*>/g, "");
            html = html.replace(/<\/?li[^>]*>/g, "<br>");
            html = html.replace(/<\/?p[^>]*>/g, "<br>");
            html = html.replace(/<a\s*([^>]*)\s*href="(.*?)"\s*([^>]*)>(.*?)<\/a>/gi, "$4 (Link->$2)<br>");
            html = html.replace(/<img\s*([^>]*)\s*src="(.*?)"\s*([^>]*)>/gi, function (match, p1, p2) {
                return p2.startsWith("http") ? "<br>Image -> " + p2 + "<br>" : "<br>Image -> " + window.location.origin + "/" + p2 + "<br>";
            });
            html = html.replace(/(<br[^>]*>\s*){1,}/g, "\n");
            html = html.replace(/\n|\r/g, "");
            html = html.replace(/(\s|^)'(\w)/g, "$1‘$2");
            html = html.replace(/(\s|^)'(\w)/g, "$1‘$2");
            html = html.replace(/(\s|^)'(\w)/g, "$1‘$2");
            html = html.replace(/\s(\w{30,})\s/g, " ");

            html = html.replace(/(\w+):(\w+)/g, "$1 $2");
            html = html.replace(/(\w+)(http)(\w+)/g, "$1");
            html = html.replace(/(\w+)(link)(\w+)/g, "$1");
            html = html.replace(/class=".*?"/g, "");

            //find ' and remove the char before it
            var index = html.indexOf("'");
            while (index > -1) {
                if (index > 0) {
                    html = html.substring(0, index - 1) + html.substring(index);
                }
                index = html.indexOf("'", index + 1);
            }
            html = html.replace(/'/g, "");

            if (html.indexOf("http") > -1) {
                html = html.replace(/http.*?\s/g, "");

            }
            html = html.replace(/-bytt/g, "");
            html = html.replace(/-\w+/g, "");
            html = html.replace(/’|‘/g, "");
            html = html.replace(/[\{\}\[\]\(\)\<\>]/g, "");
            html = html.replace(/-bytt/g, "");
            html = html.replace(/-\w+/g, "");
            html = html.replace(/\?/g, "");
            html = html.replace(/\d+/g, "");
            html = html.replace(/\b\w{20,}\b/g, "");
            html = html.replace(/qil/g, "");


            html = html.replace(/;/g, "");

            html = html.replace(/"/g, "");

            html = html.trim();
            console.log(html)
            return html;
        }

  //converts to  text allows special symbols
        $scope.htmltoText= function(html){
            var text = "";
            if (html.trim() === "") {
                return text;
            }

            html = html.replace(/&nbsp;/g, "");
            html = html.replace(/<span([^>]*)class="KFSupportStart mceNonEditable"([^>]*)>/g, "[");
            html = html.replace(/<span\s*([^>]*)\s*class="KFSupportEnd mceNonEditable"\s*([^>]*)>/g, "]");
            html = html.replace(/<span class="katex">/g, "");
            html = html.replace(/<input type="hidden"\s*([^>]*)\s*value="(.*?)"\s*([^>]*)>/gi, "Equation -> $2<br>");
            html = html.replace(/<span class="katex-html"[^>]*>(.(?!<label>))*<\/span><label><\/label>/g, "");
            html = html.replace(/<\/?span[^>]*>/g, "");
            html = html.replace(/<\/?em[^>]*>/g, "");
            html = html.replace(/<\/?strong[^>]*>/g, "");
            html = html.replace(/<\/?div[^>]*>/g, "");
            html = html.replace(/<\/?h[1-9][^>]*>/g, "");
            html = html.replace(/<\/?ul[^>]*>/g, "");
            html = html.replace(/<\/?ol[^>]*>/g, "");
            html = html.replace(/<\/?li[^>]*>/g, "<br>");
            html = html.replace(/<\/?p[^>]*>/g, "<br>");
            html = html.replace(/<a\s*([^>]*)\s*href="(.*?)"\s*([^>]*)>(.*?)<\/a>/gi, "$4 (Link->$2)<br>");
            html = html.replace(/<img\s*([^>]*)\s*src="(.*?)"\s*([^>]*)>/gi, function (match, p1, p2) {
                return p2.startsWith("http") ? "<br>Image -> " + p2 + "<br>" : "<br>Image -> " + window.location.origin + "/" + p2 + "<br>";
            });
            html = html.replace(/(<br[^>]*>\s*){1,}/g, "\n");
            html = html.replace(/\n|\r/g, "");
            html = html.replace(/(\s|^)'(\w)/g, "$1‘$2");
            html = html.replace(/(\s|^)'(\w)/g, "$1‘$2");
            html = html.replace(/(\s|^)'(\w)/g, "$1‘$2");
            html = html.replace(/\s(\w{30,})\s/g, " ");

            html = html.replace(/(\w+):(\w+)/g, "$1 $2");
            html = html.replace(/(\w+)(http)(\w+)/g, "$1");
            html = html.replace(/(\w+)(link)(\w+)/g, "$1");
            html = html.replace(/class=".*?"/g, "");


            //find ' and remove the char before it
            var index = html.indexOf("'");
            while (index > -1) {
                if (index > 0) {
                    html = html.substring(0, index - 1) + html.substring(index);
                }
                index = html.indexOf("'", index + 1);
            }
            html = html.replace(/'/g, "");

            if (html.indexOf("http") > -1) {
                html = html.replace(/http.*?\s/g, "");

            }
            html = html.replace(/-bytt/g, "");
            html = html.replace(/-\w+/g, "");
            html = html.replace(/’|‘/g, "");
            html = html.replace(/[\{\}\[\]\(\)\<\>]/g, "");
            html = html.replace(/-bytt/g, "");
            html = html.replace(/-\w+/g, "");
            html = html.replace(/\?/g, "");
            html = html.replace(/\d+/g, "");
            html = html.replace(/\b\w{20,}\b/g, "");
            html = html.trim();
            return html;
        };
        $scope.onSelectedAuthor = function( author){
            $scope.changeAuthor(author._id);
        };

        $scope.keyConceptClassifier=function (notes){
            var regex;
            var phraseClassified=[];
            var phraseNotes=[];
            $scope.phrases.forEach(function(phrase)  {
                phraseNotes=[];

                regex = new RegExp( phrase.toLowerCase().replace(/[^a-zA-Z ]/g, ""), 'g' );
                notes.forEach(function(note){
                    if((note.plainNoteData.toLowerCase().match(regex)||[]).length>0){
                        phraseNotes.push(note);
                    }
                });
                phraseClassified.push({
                    "phrase":phrase,
                    "notes":phraseNotes
                });


            });

            return phraseClassified;
        };
        $scope.phraseCount= function (text){
            var authorsNotesText=text.toLowerCase();
            var counts=[];
            var regex;
            $scope.phrases.forEach(function(phrase)  {
                regex = new RegExp( phrase.toLowerCase() );
                regex = new RegExp( phrase.toLowerCase().replace(/[^a-zA-Z ]/g, ""), 'g' );
                counts.push({"phrase":phrase,
                "count":(authorsNotesText.match(regex)  || []).length }
                    );

            });
            return counts;
        };


        $scope.showPhraseSentence= function(phrase,note){
            var notesentences = note.data.body.split(".");
            var returnPhrase="";
            var regex=new RegExp( phrase.toLowerCase().replace(/[^a-zA-Z ]/g, ""), 'g' );
            notesentences.forEach(function(sentence){
                if((sentence.toLowerCase().match(regex)||[]).length>0){

                    returnPhrase +=$scope.htmltoText(sentence)+' . ';
                }
            });
            if(returnPhrase.length>phrase.length){
            return returnPhrase;
            }
            else{
                return note.plainNoteData;
            }
        };

        $scope.createWords = function (text) {
            // concatinate all note's contents to the text
            var stopWordsExp = /^(cest|quelle|quil|ne|ils|2010|n’y|aussi|is|n'y|cet|to|in|cela|c'est|qu'il|alors|ma|mon|ceci|mettre|permettre|suis|n'est|faire|autres|bonjour|ici|quel|bien|1993|sens|sera|tous|and|avoir|etc|chaque|-|«|–|d’un|mais|an|entre|the|of|by|:|me|l'|on|a|de|des|qui|un|en|les|que|si|le|la|nos|se|et|ta|lien|ect|ainsi|p|leur|r|rôle|»|aux|sans|serait|lui|dans|comme|une|fait|très|tout|selon|sa|d'un|doit|peut|par|face|cette|leurs|être|sur|afin|est|ca|pas|son|notre|au|ce|donc|ces|ses|du|plus|sont|avant|avec|pour|ou|à|je|tu|il|elle|nous|vous)$/;



            // break into words
            var processedText = text.toLowerCase().replace(/[\(\)\+\.,\/#!$%\^&\*{}=_`~]/g, '');
            processedText = processedText.replace(/[\r\n\t\u00A0\u3000]/g, ' ');
            //\u00A0 means &nbsp; \u3000 means full-space

            //dont do this, "This" will be changed "Th" by replacing is.
            //processedText = processedText.replace(stopWordsExp, '');
            var words = processedText.split(' ');

            // filter words
            words = words.filter(function (word) {
                if (word.length > 20 || word.length < 3) {
                    return false;
                }
                //if word contain :
                if (word.indexOf(':') > -1) {
                    return false;
                }
                if (word.match(stopWordsExp)) {
                    return false;
                }
                if (word.length === 0) { //one-character word in ChineseCharacter like 車 cannot be detected if threshold is 1.
                    return false;
                }
                return true;
            });

            // count frequency using hashtable
            var wordCountTable = {};
            words.forEach(function (each) {
                if (!wordCountTable[each]) {
                    wordCountTable[each] = 0;
                }

                wordCountTable[each]++; // {'hi': 12, 'foo': 2 ...}
            });

            // change the data format into object array
            var wordCounts = [];
            for (var key in wordCountTable) {
                wordCounts.push({
                    word: key,
                    count: wordCountTable[key]
                });
            }

            // sort by frequency
            wordCounts.sort(function (a, b) {
                if (a.count > b.count) {
                    return -1;
                }
                if (a.count < b.count) {
                    return 1;
                }
                return 0;
            });


            return wordCounts;
        };

        $scope.changeAuthor = function (selectedauthor) {
            if ($scope.authorNotesMap[selectedauthor]) {
                if ($scope.authorNotesMap[selectedauthor].wordCounts.length > 0) {
                    $scope.noWords = false;
                } else {
                    $scope.noWords = true;
                }
                    // var countMax = d3.max($scope.authorNotesMap[selectedauthor].wordCounts, function (d) {
                    //     return d.count;
                    // });
                    $scope.authorwords = $scope.authorNotesMap[selectedauthor].wordCounts;
                    $scope.phraseWords=$scope.authorNotesMap[selectedauthor].phraseCounts;
                    $scope.authorKeyconcepts=$scope.authorNotesMap[selectedauthor].keyConceptsClassified;

                    // Draw wordcloud from the notes
                    // var sizeScale = d3.scale.linear().domain([0, countMax]).range([10, 100]);
                    // var d3CloudData = $scope.authorNotesMap[selectedauthor].wordCounts.map(function (d) {
                    //     return {
                    //         text: d.word,
                    //         size: sizeScale(d.count)
                    //     };
                    // });
                    // $scope.drawWordcloud(d3CloudData);

            }

        };

        $scope.drawWordcloud = function (words) {
            function draw(words) {
                d3.select("#studentwcloud").select("svg").remove();
                d3.select('#studentwcloud').append('svg')
                    .attr('width', layout.size()[0])
                    .attr('height', layout.size()[1])
                    .append('g')
                    .attr('transform', 'translate(' + layout.size()[0] / 2 + ',' + layout.size()[1] / 2 + ')')
                    .selectAll('text')
                    .data(words)
                    .enter().append('text')
                    .style('font-size', function (d) {
                        return d.size + 'px';
                    })
                    .style('font-family', 'Impact')
                    .style('fill', function (d, i) {
                        return fill(i);
                    })
                    .attr('text-anchor', 'middle')
                    .attr('transform', function (d) {
                        return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
                    })
                    .text(function (d) {
                        return d.text;
                    });
            }

            var fill = d3.scale.category20();
            var layout = d3.layout.cloud()
                .size([500, 500])
                .words(words)
                .padding(5)
                .rotate(function () {
                    return Math.floor(Math.random() * 2) * 90;
                })
                .font('Impact')
                .fontSize(function (d) {
                    return d.size;
                })
                .on('end', draw);
            layout.start();
        };

    });
