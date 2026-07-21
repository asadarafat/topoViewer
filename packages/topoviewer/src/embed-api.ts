export interface TopoViewerEmbedApi {
  mountAll(): void;
}

declare global {
  interface Window {
    TopoViewerEmbed: TopoViewerEmbedApi;
  }
}
