(function () {
  try {
    var _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__kf6_block_bad_view = /\/api\/links\/view\/undefined\b/.test(url);
      return _open.apply(this, arguments);
    };
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      if (this.__kf6_block_bad_view) {
        console.warn('[http-guard] blocked /api/links/view/undefined');
        return; // n’envoie pas la requête
      }
      return _send.apply(this, arguments);
    };
  } catch (e) {
    console.warn('[http-guard] failed', e);
  }
})();
