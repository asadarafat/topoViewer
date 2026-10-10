/* Shared publication identity and accessibility repairs for the alternate host. */
(function () {
  function roots() {
    var found = [document];
    for (var index = 0; index < found.length; index += 1) {
      found[index].querySelectorAll('*').forEach(function (element) {
        if (element.shadowRoot) found.push(element.shadowRoot);
      });
    }
    return found;
  }
  function attribute(element, name, value) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }
  function update() {
    var article = document.querySelector('article.md-content__inner');
    if (article && !article.querySelector('.tv-docs-version')) {
      var notice = document.createElement('aside');
      notice.className = 'tv-docs-version';
      notice.setAttribute('aria-label', 'Documentation version');
      var link = document.createElement('a');
      link.href = '/topoviewer/docs/mkdocs/topoviewer/start/documentation-versions/';
      link.textContent = 'Development documentation · released recipes: 0.5.0';
      notice.appendChild(link);
      article.prepend(notice);
    }
    // Zensical 0.0.45 renders search inside an open shadow root. Review the
    // repairs when upgrading the host; do not assume document selectors reach it.
    roots().forEach(function (root) {
      var input = root.querySelector('input[role="combobox"]');
      if (input) {
        attribute(input, 'aria-label', 'Search documentation');
        var scroll = root.querySelector('.i');
        var popup = scroll && scroll.parentElement;
        if (popup) {
          attribute(popup, 'id', 'tv-docs-search-popup');
          attribute(input, 'aria-controls', popup.id);
        }
        attribute(input, 'aria-expanded', String(root.activeElement !== null));
        if (scroll) attribute(scroll, 'tabindex', '0');
        root.querySelectorAll('button').forEach(function (button) {
          if (button.querySelector('.lucide-search')) attribute(button, 'aria-label', 'Submit search');
          if (button.querySelector('.lucide-list-filter')) attribute(button, 'aria-label', 'Search filters');
          if (button.querySelector('.lucide-corner-down-left')) attribute(button, 'aria-label', 'Open search result');
        });
      }
      root.querySelectorAll('.md-search-result pre code').forEach(function (code) { attribute(code, 'tabindex', '0'); });
      root.querySelectorAll('label.md-overlay[aria-label]').forEach(function (label) { label.removeAttribute('aria-label'); });
    });
  }
  var scheduled = false;
  var observer = new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      observer.disconnect();
      update();
      watch();
    });
  });
  function watch() {
    roots().forEach(function (root) {
      observer.observe(root === document ? document.body : root, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['aria-label', 'aria-controls', 'aria-expanded']
      });
    });
  }
  function start() { update(); watch(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  document.addEventListener('focusin', update);
  document.addEventListener('focusout', update);
})();
