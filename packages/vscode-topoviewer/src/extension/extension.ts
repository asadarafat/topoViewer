import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as vscode from 'vscode';

interface PreviewState {
  topologyText: string;
  stylesheetText: string;
  topologyPath?: string;
  stylesheetPath?: string;
  topologyMissing?: boolean;
  stylesheetMissing?: boolean;
}

interface ExportViewportMessage {
  type: 'exportViewport';
  format?: 'png' | 'svg';
  fileName?: string;
  dataUrl?: string;
}

function isExportViewportMessage(message: { type?: string } | ExportViewportMessage): message is ExportViewportMessage {
  return message.type === 'exportViewport';
}

function nonce() {
  return crypto.randomBytes(16).toString('hex');
}

function extensionAssetUris(context: vscode.ExtensionContext, webview: vscode.Webview) {
  const assetsDir = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'assets');
  const diskAssetsDir = path.join(context.extensionPath, 'dist', 'webview', 'assets');
  const assets = fs.existsSync(diskAssetsDir) ? fs.readdirSync(diskAssetsDir) : [];
  const script = assets.find((asset) => asset === 'index.js') || assets.find((asset) => asset.endsWith('.js'));
  const styles = assets.filter((asset) => asset.endsWith('.css'));
  if (!script) {
    throw new Error('TopoViewer webview assets are missing. Run npm run build in packages/vscode-topoviewer.');
  }
  return {
    scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(assetsDir, script)),
    styleUris: styles.map((style) => webview.asWebviewUri(vscode.Uri.joinPath(assetsDir, style)))
  };
}

async function readText(uri: vscode.Uri | undefined): Promise<{ text: string; missing: boolean }> {
  if (!uri) return { text: '', missing: true };
  try {
    const data = await vscode.workspace.fs.readFile(uri);
    return { text: Buffer.from(data).toString('utf8'), missing: false };
  } catch {
    return { text: '', missing: true };
  }
}

function sibling(uri: vscode.Uri, fileName: string) {
  return vscode.Uri.joinPath(uri.with({ path: path.posix.dirname(uri.path) }), fileName);
}

function pairedUris(activeUri: vscode.Uri): { topologyUri: vscode.Uri; stylesheetUri: vscode.Uri } {
  const config = vscode.workspace.getConfiguration('topoviewer.preview', activeUri);
  const defaultTopology = config.get<string>('defaultTopology', 'topology.yaml');
  const defaultStylesheet = config.get<string>('defaultStylesheet', 'stylesheet.yaml');
  const base = path.posix.basename(activeUri.path).toLowerCase();
  if (base.includes('stylesheet') || base.includes('style')) {
    return { topologyUri: sibling(activeUri, defaultTopology), stylesheetUri: activeUri };
  }
  return { topologyUri: activeUri, stylesheetUri: sibling(activeUri, defaultStylesheet) };
}

async function previewState(topologyUri: vscode.Uri, stylesheetUri: vscode.Uri): Promise<PreviewState> {
  const [topology, stylesheet] = await Promise.all([
    readText(topologyUri),
    readText(stylesheetUri)
  ]);
  return {
    topologyPath: topologyUri.fsPath,
    stylesheetPath: stylesheetUri.fsPath,
    topologyText: topology.text,
    stylesheetText: stylesheet.text,
    topologyMissing: topology.missing,
    stylesheetMissing: stylesheet.missing
  };
}

class TopoViewerPreviewPanel {
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly panel: vscode.WebviewPanel,
    private readonly topologyUri: vscode.Uri,
    private readonly stylesheetUri: vscode.Uri
  ) {
    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')]
    };
    this.panel.webview.html = this.html();
    this.panel.webview.onDidReceiveMessage((message) => this.handleMessage(message), undefined, this.disposables);
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.uri.toString() === this.topologyUri.toString() || document.uri.toString() === this.stylesheetUri.toString()) {
        this.postState();
      }
    }, undefined, this.disposables);
    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
  }

  private html() {
    const token = nonce();
    const { scriptUri, styleUris } = extensionAssetUris(this.context, this.panel.webview);
    const styles = styleUris.map((uri) => `<link rel="stylesheet" href="${uri}">`).join('\n');
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${this.panel.webview.cspSource} data: blob:; font-src ${this.panel.webview.cspSource} data:; style-src ${this.panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${token}' ${this.panel.webview.cspSource}; worker-src ${this.panel.webview.cspSource} blob:; child-src ${this.panel.webview.cspSource} blob:;">
    ${styles}
    <title>TopoViewer Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" nonce="${token}" src="${scriptUri}"></script>
  </body>
</html>`;
  }

  private async handleMessage(message: { type?: string; target?: string } | ExportViewportMessage) {
    if (message.type === 'ready' || message.type === 'requestState') {
      await this.postState();
    }
    if (message.type === 'openDocs') {
      await vscode.env.openExternal(vscode.Uri.parse(`https://asadarafat.github.io/TopoViewer/${message.target || ''}`));
    }
    if (isExportViewportMessage(message)) {
      await this.saveExport(message);
    }
  }

  private async saveExport(message: ExportViewportMessage) {
    const format = message.format || 'png';
    const dataUrl = message.dataUrl || '';
    const payload = dataUrl.match(/^data:[^;]+;base64,(.+)$/)?.[1];
    if (!payload) {
      void vscode.window.showErrorMessage('TopoViewer export did not include a valid image payload.');
      return;
    }

    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || this.context.extensionPath,
        message.fileName || `topoviewer.${format}`
      )),
      filters: format === 'svg' ? { SVG: ['svg'] } : { PNG: ['png'] },
      saveLabel: 'Export TopoViewer viewport'
    });
    if (!target) return;

    await vscode.workspace.fs.writeFile(target, Buffer.from(payload, 'base64'));
    const open = 'Open';
    const result = await vscode.window.showInformationMessage(`Exported ${path.basename(target.fsPath)}.`, open);
    if (result === open) {
      await vscode.env.openExternal(target);
    }
  }

  private async postState() {
    await this.panel.webview.postMessage({
      type: 'state',
      state: await previewState(this.topologyUri, this.stylesheetUri)
    });
  }

  dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}

async function openPreview(context: vscode.ExtensionContext, viewColumn: vscode.ViewColumn) {
  const active = vscode.window.activeTextEditor?.document.uri;
  if (!active) {
    void vscode.window.showWarningMessage('Open a TopoViewer topology.yaml or stylesheet.yaml file first.');
    return;
  }
  const { topologyUri, stylesheetUri } = pairedUris(active);
  const panel = vscode.window.createWebviewPanel(
    'topoviewer.preview',
    'TopoViewer Preview',
    viewColumn,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  new TopoViewerPreviewPanel(context, panel, topologyUri, stylesheetUri);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('topoviewer.openPreview', () => openPreview(context, vscode.ViewColumn.Active)),
    vscode.commands.registerCommand('topoviewer.openPreviewToSide', () => openPreview(context, vscode.ViewColumn.Beside))
  );
}

export function deactivate() {}
