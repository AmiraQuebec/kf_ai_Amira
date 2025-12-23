(function(){
  var MIN_WORDS = 10;

  function getPlainText(){
    // 1) Source fiable : le body éditable de l'éditeur actif
    try {
      if (window.tinymce && tinymce.activeEditor) {
        // innerText = texte réellement visible dans la zone d’édition
        var body = tinymce.activeEditor.getBody();
        return (body && body.innerText ? body.innerText : '').trim();
      }
    } catch(e){}

    // 2) Fallback strict : UNIQUEMENT le body éditable visible
    var bodyEl = document.querySelector('.mce-content-body[contenteditable="true"]');
    return bodyEl ? (bodyEl.innerText || '').trim() : '';
  }

  function countWords(txt){
    if (!txt) return 0;
    // normalise les espaces (y compris &nbsp;)
    txt = txt.replace(/\u00A0/g, ' ').trim();
    if (!txt) return 0;
    // compte les tokens “visibles”
    var tokens = txt.split(/\s+/).filter(Boolean);
    return tokens.length;
  }

  function showMessage(msgHtml){
    // si le modal IA est ouvert, on y écrit le message
    var body = document.querySelector('.modal.in .modal-body') ||
               document.querySelector('.modal .modal-body');
    if (body) { body.innerHTML = msgHtml; return; }
    // sinon, fallback alert
    alert(msgHtml.replace(/<[^>]*>/g,' '));
  }

  // Intercepte tous les boutons IA
  document.addEventListener('click', function(ev){
    var btn = ev.target.closest('.btn-spell-checker');
    if (!btn) return;

    var plain = getPlainText();
    var wc = countWords(plain);

    if (wc < MIN_WORDS) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      showMessage(
        '<div style="font-size:14px;line-height:1.4">' +
        '⚠️ Votre texte est trop court. Il faut au minimum <b>' + MIN_WORDS + '</b> mots.' +
        '<br>Mots actuels : <b>' + wc + '</b>.' +
        '</div>'
      );
      return false;
    }
  }, true); // capture=true => passe avant ng-click
})();
