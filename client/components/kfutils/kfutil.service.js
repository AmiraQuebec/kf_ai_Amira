'use strict';

angular.module('kf6App')
    .factory('$kfutil', function ($location, $http, $q) {
        var obj = {};

        obj.getTimeString = function (time) {
            var d = new Date(time);
            return d.toLocaleString();
        };

        // obj.isSafari = function() {
        //     // var firefox = (e.offsetX === undefined);
        //     // var safari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') <= -1;
        //     // //var chrome = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') > -1;
        //     // var IE = (navigator.userAgent.indexOf('MSIE') !== -1 || document.documentMode <= 11); /*IE11*/
        // }

        //http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
        function detect() {
            var ua = navigator.userAgent,
                tem,
                M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'IE ' + (tem[1] || '');
            }
            if (M[1] === 'Chrome') {
                tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
                if (tem !== null) {
                    return tem.slice(1).join(' ').replace('OPR', 'Opera');
                }
            }
            M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
            if ((tem = ua.match(/version\/(\d+)/i)) !== null) {
                M.splice(1, 1, tem[1]);
            }
            return M.join(' ');
        }

        obj.browser = (function () {
            var tokens = detect().split(' ');
            var browser = {};
            browser.name = tokens[0].toLowerCase();
            if (tokens.length >= 2) {
                browser.version = parseFloat(tokens[1]);
            }
            return browser;
        })();

        obj.isSafari = function () {
            return obj.browser.name === 'safari';
        };

        obj.isChrome = function () {
            return obj.browser.name === 'chrome';
        };

        obj.isFirefox = function () {
            return obj.browser.name === 'firefox';
        };

        obj.isIE = function () {
            return obj.browser.name === 'ie' || obj.browser.name === 'msie';
        };

        obj.isiOS = function () {
            var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
            return iOS;
        };
        
        obj.getKfVersion = function(){
            //This is important in kfutil as 
            //future plugins will need refernce to the version to test compatibility
            var deferred = $q.defer();
            $http.get('api/version')
            .success(function(versionObj) {
                deferred.resolve(versionObj);
            })
            .error(function(){
                deferred.reject('Error Fetching version information');
            });
            return deferred.promise;
        };

        obj.isAndroid = function () {
            var ua = navigator.userAgent.toLowerCase();
            var isAndroid = ua.indexOf('android') > -1;
            return isAndroid;
        };

        obj.isMobile = function () {
            return obj.isiOS() || obj.isAndroid();
        };

        obj.getOffset = function (e) {
            if (obj.isFirefox()) {
                if (e.type === 'contextmenu') {
                    return {
                        x: e.originalEvent.layerX,
                        y: e.originalEvent.layerY
                    };
                }
                return {
                    x: e.layerX,
                    y: e.layerY
                };
            }

            //other browser
            return {
                x: e.offsetX,
                y: e.offsetY
            };
        };

        obj.getTouchPos = function (touchEvent) {
            var changed = touchEvent.changedTouches[0];
            return {
                x: changed.pageX,
                y: changed.pageY
            };
        };

        obj.getTouchOffset = function (touchEvent, jElem) {
            var p = obj.getTouchPos(touchEvent);
            return {
                x: p.x + -(jElem.offset().left),
                y: p.y + -(jElem.offset().top)
            };
        };

        obj.fireContextMenuEvent = function (touchEvent, jElem) {
            var el = jElem[0];
            var evt = el.ownerDocument.createEvent('HTMLEvents');
            evt.initEvent('contextmenu', true, true); // bubbles = true, cancelable = true
            var p = obj.getTouchPos(touchEvent);
            var offset = obj.getTouchOffset(touchEvent, jElem);
            evt.pageX = p.x;
            evt.pageY = p.y;
            evt.offsetX = offset.x;
            evt.offsetY = offset.y;
            if (document.createEventObject) {
                return el.fireEvent('oncontextmenu', evt);
            } else {
                return !el.dispatchEvent(evt);
            }
        };

        obj.copyClipboardOniOS = function (content) {
            var copyboard = document.getElementById('copyboard');
            if (!copyboard) {
                window.alert('error copyboard element not found for iOS support.');
                return;
            }
            copyboard.innerText = content;
            var rng = document.createRange();
            rng.selectNodeContents(copyboard);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(rng);
        };

        obj.mixIn = function (scope) {
            scope.getTimeString = obj.getTimeString;
            scope.isIE = obj.isIE;
            scope.isiOS = obj.isiOS;
            scope.isAndroid = obj.isAndroid;
            scope.isMobile = obj.isMobile;
            scope.browser = function () {
                return obj.browser;
            };
        };

        obj.hostURL = $location.protocol() + '://' + $location.host();
        if ($location.port() !== 80 && $location.port() !== 443) {
            obj.hostURL += ':' + $location.port();
        }
        obj.getLanguages = function (){
            var langs= {"Abkhaz":"ab",
                "Afar":"aa",
                "Afrikaans":"af",
                "Akan":"ak",
                "Albanian":"sq",
                "Amharic":"am",
                "Arabic":"ar",
                "Aragonese":"an",
                "Armenian":"hy",
                "Assamese":"as",
                "Avaric":"av",
                "Avestan":"ae",
                "Aymara":"ay",
                "Bambara":"bm",
                "Bashkir":"ba",
                "Basque":"eu",
                "Belarusian":"be",
                "Bengali; Bangla":"bn",
                "Bihari":"bh",
                "Bislama":"bi",
                "Bosnian":"bs",
                "Breton":"br",
                "Bulgarian":"bg",
                "Burmese":"my",
                "Catalan; Valencian":"ca",
                "Chamorro":"ch",
                "Chechen":"ce",
                "Chichewa; Chewa; Nyanja":"ny",
                "Chinese":"zh",
                "Chuvash":"cv",
                "Cornish":"kw",
                "Corsican":"co",
                "Cree":"cr",
                "Croatian":"hr",
                "Czech":"cs",
                "Danish":"da",
                "Divehi; Dhivehi; Maldivian;":"dv",
                "Dutch":"nl",
                "Dzongkha":"dz",
                "English":"en",
                "Esperanto":"eo",
                "Estonian":"et",
                "Ewe":"ee",
                "Faroese":"fo",
                "Fijian":"fj",
                "Finnish":"fi",
                "French":"fr",
                "Fula; Fulah; Pulaar; Pular":"ff",
                "Galician":"gl",
                "Ganda":"lg",
                "Georgian":"ka",
                "German":"de",
                "Greek, Modern":"el",
                "Guarani":"gn",
                "Gujarati":"gu",
                "Haitian; Haitian Creole":"ht",
                "Hausa":"ha",
                "Hebrew (modern)":"he",
                "Herero":"hz",
                "Hindi":"hi",
                "Hiri Motu":"ho",
                "Hungarian":"hu",
                "Icelandic":"is",
                "Ido":"io",
                "Igbo":"ig",
                "Indonesian":"id",
                "Interlingua":"ia",
                "Interlingue":"ie",
                "Inuktitut":"iu",
                "Inupiaq":"ik",
                "Irish":"ga",
                "Italian":"it",
                "Japanese":"ja",
                "Javanese":"jv",
                "Kalaallisut, Greenlandic":"kl",
                "Kannada":"kn",
                "Kanuri":"kr",
                "Kashmiri":"ks",
                "Kazakh":"kk",
                "Khmer":"km",
                "Kikuyu, Gikuyu":"ki",
                "Kinyarwanda":"rw",
                "Kirundi":"rn",
                "Komi":"kv",
                "Kongo":"kg",
                "Korean":"ko",
                "Kurdish":"ku",
                "Kwanyama, Kuanyama":"kj",
                "Kyrgyz":"ky",
                "Lao":"lo",
                "Latin":"la",
                "Latvian":"lv",
                "Limburgish, Limburgan, Limburger":"li",
                "Lingala":"ln",
                "Lithuanian":"lt",
                "Luba-Katanga":"lu",
                "Luxembourgish, Letzeburgesch":"lb",
                "Macedonian":"mk",
                "Malagasy":"mg",
                "Malay":"ms",
                "Malayalam":"ml",
                "Maltese":"mt",
                "Manx":"gv",
                "Marathi":"mr",
                "Marshallese":"mh",
                "Mongolian":"mn",
                "MÄori":"mi",
                "Nauru":"na",
                "Navajo, Navaho":"nv",
                "Ndonga":"ng",
                "Nepali":"ne",
                "North Ndebele":"nd",
                "Northern Sami":"se",
                "Norwegian BokmÃ¥l":"nb",
                "Norwegian Nynorsk":"nn",
                "Norwegian":"no",
                "Nuosu":"ii",
                "Occitan":"oc",
                "Ojibwe, Ojibwa":"oj",
                "Old Church Slavonic, Church Slavic, Church Slavonic, Old Bulgarian, Old Slavonic":"cu",
                "Oriya":"or",
                "Oromo":"om",
                "Ossetian, Ossetic":"os",
                "Panjabi, Punjabi":"pa",
                "Pashto, Pushto":"ps",
                "Persian (Farsi)":"fa",
                "Polish":"pl",
                "Portuguese":"pt",
                "PÄli":"pi",
                "Quechua":"qu",
                "Romanian, [])":"ro",
                "Romansh":"rm",
                "Russian":"ru",
                "Samoan":"sm",
                "Sango":"sg",
                "Sanskrit (Saá¹ská¹›ta)":"sa",
                "Sardinian":"sc",
                "Scottish Gaelic; Gaelic":"gd",
                "Serbian":"sr",
                "Shona":"sn",
                "Sindhi":"sd",
                "Sinhala, Sinhalese":"si",
                "Slovak":"sk",
                "Slovene":"sl",
                "Somali":"so",
                "South Azerbaijani":"az",
                "South Ndebele":"nr",
                "Southern Sotho":"st",
                "Spanish; Castilian":"es",
                "Sundanese":"su",
                "Swahili":"sw",
                "Swati":"ss",
                "Swedish":"sv",
                "Tagalog":"tl",
                "Tahitian":"ty",
                "Tajik":"tg",
                "Tamil":"ta",
                "Tatar":"tt",
                "Telugu":"te",
                "Thai":"th",
                "Tibetan Standard, Tibetan, Central":"bo",
                "Tigrinya":"ti",
                "Tonga (Tonga Islands)":"to",
                "Tsonga":"ts",
                "Tswana":"tn",
                "Turkish":"tr",
                "Turkmen":"tk",
                "Twi":"tw",
                "Ukrainian":"uk",
                "Urdu":"ur",
                "Uyghur, Uighur":"ug",
                "Uzbek":"uz",
                "Venda":"ve",
                "Vietnamese":"vi",
                "VolapÃ¼k":"vo",
                "Walloon":"wa",
                "Welsh":"cy",
                "Western Frisian":"fy",
                "Wolof":"wo",
                "Xhosa":"xh",
                "Yiddish":"yi",
                "Yoruba":"yo",
                "Zhuang, Chuang":"za",
                "Zulu":"zu"
            };
            return langs;
        };

        return obj;
    });
