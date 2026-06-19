(function () {
  function mountTopoViewerEmbeds() {
    window.TopoViewerEmbed?.mountAll?.();
  }

  if (window.document$?.subscribe) {
    window.document$.subscribe(mountTopoViewerEmbeds);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountTopoViewerEmbeds, { once: true });
  } else {
    mountTopoViewerEmbeds();
  }
}());
