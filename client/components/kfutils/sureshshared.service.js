'use strict';

angular.module('kf6App')
    .factory('$sureshshared', function () {
        var obj = {};

        obj.strip = function (html) {
            var tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return (tmp.textContent || tmp.innerText || "");
        };

        obj.getWordsArray = function (content) {
            return content.split(" ");
        };

        obj.hasSubString = function (fullString, subString) {
          var inx= fullString.toLowerCase().replace(/\s\s|\s/g, '').indexOf(subString.toLowerCase().replace(/\s\s|\s/g, ''));
           if(inx===-1){
               return false;
           }
           return true;
        };

        obj.getSelectionText = function () {
            var text = '';
            if (window.getSelection) {
                text = window.getSelection().toString();
            } else if (document.selection && document.selection.type !== 'Control') {
                text = document.selection.createRange().text;
            }
            return text;
        };

        obj.clearSelection = function () {
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            } else if (document.selection) {
                document.selection.empty();
            }
        };

        obj.getChangedBodyContent = function (bodyContentText, bodyContentWordsArray, subContentWordsArray, subContentText, color) {
            var str = '';
            var startIndexOfsubContentText = bodyContentText.replace(/\s/g, '').indexOf(subContentText.replace(/\s/g, ''));
            var beforeWordOfsubContentText = bodyContentText.replace(/\s/g, '').substring(0, startIndexOfsubContentText - 1);
            var afterWordOfsubContentText = bodyContentText.replace(/\s/g, '').substring(startIndexOfsubContentText + subContentText.replace(/\s/g, '').length, bodyContentText.replace(/\s/g, '').length);
            var firstWordIndexOfsubContentText = getfirstWordIndexOfsubContentText(bodyContentWordsArray, beforeWordOfsubContentText);
            var lastWordIndexOfsubContentText = getlastWordIndexOfsubContentText(bodyContentWordsArray, afterWordOfsubContentText);
            var style = "style=\"font-weight: bold; color:black; background-color:" + color + "; \"";
            for (var i = firstWordIndexOfsubContentText; i < lastWordIndexOfsubContentText; i++) {
                if (bodyContentWordsArray[i].indexOf('<body>') !== -1) {
                    str = "<span " + style + " >" + subContentWordsArray[0] + " " + "</span>";
                    bodyContentWordsArray[i] = bodyContentWordsArray[i].replace(subContentWordsArray[0], str);
                } else if (bodyContentWordsArray[i].indexOf('</body>') !== -1) {
                    str = "<span " + style + " >" + subContentWordsArray[subContentWordsArray.length - 1] + " " + "</span>";
                    bodyContentWordsArray[i] = bodyContentWordsArray[i].replace(subContentWordsArray[subContentWordsArray.length - 1], str);
                } else {
                    bodyContentWordsArray[i] = setColorInWord(bodyContentWordsArray[i], subContentText.replace(/\s/g, ''), style);
                }
            }
            return bodyContentWordsArray.join(' ').toString();
        };

        function getfirstWordIndexOfsubContentText(bodyContentWordsArray, subContentText) { //check again
            var startWordInBodyContent = '',
                index = 0;
            if (subContentText.replace(/\s/g, '').length !== 0) {
                for (var k = 0; k < bodyContentWordsArray.length; k++) {
                    startWordInBodyContent += bodyContentWordsArray[k] + ' ';
                    if (obj.strip(startWordInBodyContent).replace(/\s/g, '').indexOf(subContentText) !== -1) {
                        index = k;
                        break;
                    }
                }
            }
            return index;
        }

        function getlastWordIndexOfsubContentText(bodyContentWordsArray, subContentText) {
            var startWordInBodyContent = '',
                index = bodyContentWordsArray.length;
            if (subContentText.replace(/\s/g, '').length !== 0) {
                for (var k = bodyContentWordsArray.length - 1; k >= 0; k--) {
                    startWordInBodyContent = bodyContentWordsArray[k] + ' ' + startWordInBodyContent;
                    if (obj.strip(startWordInBodyContent).replace(/\s/g, '').indexOf(subContentText) !== -1) {
                        index = k;
                        break;
                    }
                }
            }
            return index;
        }

        function setColorInWord(word, subContentText, style) {
            var onlytxt = word.replace(/(<([^>]+)>)/ig, '').replace('class=\"kfSupportStartLabel\">', '');
            onlytxt = onlytxt.replace(/\/?[a-z][a-z0-9]*[^>]*>/ig, '');
            onlytxt = onlytxt.replace('<span', '').replace(/<\/?span[^>]*>/g, '');
            if (word.indexOf('<br>') !== -1) {
                onlytxt = word.replace('<span', '').replace(/<\/?span[^>]*>/g, '');
            }
            var curtxt = onlytxt;
            onlytxt = obj.strip(onlytxt.replace(/&nbsp;|(<([^>]+)>)|\/>|>/ig, ''));
            onlytxt = onlytxt.replace('—', '&mdash;').replace('–', '&ndash;');
            if (subContentText.replace(/\s/g, '').replace('—', '&mdash;').indexOf(onlytxt.replace(/\s/g, '')) !== -1 && onlytxt !== '') {
                if (word.indexOf('&nbsp;') !== -1||word.indexOf('&ldquo;') !== -1||word.indexOf('&rdquo;') !== -1) {
                    onlytxt = curtxt;
                }
                var str = "<span " + style + " >" + onlytxt + " " + "</span>";
                word = word.replace(/\s\s|\s/g, '').replace(onlytxt, str);
            }
            return word;
        }

        return obj;
    });
