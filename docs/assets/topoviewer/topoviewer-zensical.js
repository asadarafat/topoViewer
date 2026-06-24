(function () {
  var scheduled = false;

  function mountTopoViewerEmbeds() {
    scheduled = false;
    if (window.TopoViewerEmbed && typeof window.TopoViewerEmbed.mountAll === 'function') {
      window.TopoViewerEmbed.mountAll();
    }
    window.dispatchEvent(new Event('resize'));
  }

  function scheduleMount() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      mountTopoViewerEmbeds();
      window.setTimeout(mountTopoViewerEmbeds, 80);
      window.setTimeout(mountTopoViewerEmbeds, 300);
    });
  }

  function subscribeToZensical() {
    if (window.zensical && window.zensical.document$ && typeof window.zensical.document$.subscribe === 'function') {
      window.zensical.document$.subscribe(scheduleMount);
      return true;
    }
    return false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMount, { once: true });
  } else {
    scheduleMount();
  }

  if (!subscribeToZensical()) {
    var subscriptionAttempts = 0;
    var subscriptionTimer = window.setInterval(function () {
      subscriptionAttempts += 1;
      if (subscribeToZensical() || subscriptionAttempts >= 20) {
        window.clearInterval(subscriptionTimer);
      }
    }, 100);
  }

  var observer = new MutationObserver(scheduleMount);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['hidden', 'style', 'class', 'aria-selected'],
    childList: true,
    subtree: true
  });

  window.addEventListener('pageshow', scheduleMount);
  window.addEventListener('hashchange', scheduleMount);
})();
