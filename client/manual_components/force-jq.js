(function () {
  if (!window.angular || !window.jQuery) { return; }
  try {
    if (angular.element !== window.jQuery) {
      console.log('[force-jq] switching angular.element to jQuery');
      angular.element = window.jQuery;   // force Angular à utiliser la même instance de jQuery
    } else {
      console.log('[force-jq] already using jQuery');
    }
  } catch (e) {
    console.warn('[force-jq] failed:', e);
  }
})();
