(function () {
  function mountTopoViewerEmbeds() {
    if (window.TopoViewerEmbed && typeof window.TopoViewerEmbed.mountAll === 'function') {
      window.TopoViewerEmbed.mountAll();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountTopoViewerEmbeds, { once: true });
  } else {
    mountTopoViewerEmbeds();
  }

  if (window.zensical && window.zensical.document$ && typeof window.zensical.document$.subscribe === 'function') {
    window.zensical.document$.subscribe(mountTopoViewerEmbeds);
  }

  window.addEventListener('pageshow', mountTopoViewerEmbeds);
})();
