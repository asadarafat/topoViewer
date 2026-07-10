import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import {
  dispatchStudioHostRequest,
  parseStudioHostReport,
  parseStudioHostRequest,
  type StudioHostResponseMessage,
  type StudioHostWatchMessage
} from '../shared/studioHostProtocol';
import { VsCodeWorkspacePort, bundleRoot, relativeBundlePath } from './vscodeWorkspacePort';
import { WorkspaceStudioHost } from './workspaceStudioHost';
import { studioWebviewContentSecurityPolicy } from './webviewSecurity';

interface BundleUris {
  mapper: vscode.Uri;
  stylesheet: vscode.Uri;
  topology: vscode.Uri;
}

function nonce() {
  return crypto.randomBytes(16).toString('base64url');
}

function extensionAssetUris(context: vscode.ExtensionContext, webview: vscode.Webview) {
  const assetsDirectory = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'assets');
  const diskAssetsDirectory = path.join(context.extensionPath, 'dist', 'webview', 'assets');
  const assets = fs.existsSync(diskAssetsDirectory) ? fs.readdirSync(diskAssetsDirectory) : [];
  const script = assets.find((asset) => asset === 'index.js') || assets.find((asset) => asset.endsWith('.js'));
  const styles = assets.filter((asset) => asset.endsWith('.css'));
  if (!script) throw new Error('TopoViewer Studio webview assets are missing. Build the extension before opening Studio.');
  return {
    script: webview.asWebviewUri(vscode.Uri.joinPath(assetsDirectory, script)),
    styles: styles.map((style) => webview.asWebviewUri(vscode.Uri.joinPath(assetsDirectory, style)))
  };
}

function sibling(uri: vscode.Uri, fileName: string) {
  return vscode.Uri.joinPath(uri.with({ path: path.posix.dirname(uri.path) }), fileName);
}

function pairedUris(active: vscode.Uri): BundleUris {
  const configuration = vscode.workspace.getConfiguration('topoviewer.preview', active);
  const topologyName = configuration.get<string>('defaultTopology', 'topology.yaml');
  const stylesheetName = configuration.get<string>('defaultStylesheet', 'stylesheet.yaml');
  const mapperName = configuration.get<string>('defaultMapper', 'mapper.tv.yaml');
  const baseName = path.posix.basename(active.path).toLowerCase();
  if (baseName.includes('mapper')) {
    return { mapper: active, stylesheet: sibling(active, stylesheetName), topology: sibling(active, topologyName) };
  }
  if (baseName.includes('stylesheet') || baseName.includes('style')) {
    return { mapper: sibling(active, mapperName), stylesheet: active, topology: sibling(active, topologyName) };
  }
  return { mapper: sibling(active, mapperName), stylesheet: sibling(active, stylesheetName), topology: active };
}

function assertTrustedBundleRoot(active: vscode.Uri, root: vscode.Uri) {
  const folder = vscode.workspace.getWorkspaceFolder(active);
  if (!folder) return;
  if (folder.uri.toString(true) === root.toString(true)) return;
  relativeBundlePath(folder.uri, root);
}

class TopoViewerStudioPanel {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly host: WorkspaceStudioHost;
  private readonly unwatch: () => void;

  constructor(
    context: vscode.ExtensionContext,
    private readonly panel: vscode.WebviewPanel,
    output: vscode.OutputChannel,
    uris: BundleUris
  ) {
    const root = bundleRoot(uris.topology);
    assertTrustedBundleRoot(uris.topology, root);
    const port = new VsCodeWorkspacePort({ context, output, root });
    this.host = new WorkspaceStudioHost({
      mapperPath: relativeBundlePath(root, uris.mapper),
      port,
      stylesheetPath: relativeBundlePath(root, uris.stylesheet),
      topologyPath: relativeBundlePath(root, uris.topology)
    });
    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')]
    };
    this.panel.webview.html = this.html(context);
    this.panel.webview.onDidReceiveMessage((message) => void this.handleMessage(message), undefined, this.disposables);
    this.unwatch = this.host.watchProject?.((event) => {
      const message: StudioHostWatchMessage = { event, type: 'studio:host-watch' };
      void this.panel.webview.postMessage(message);
    }) || (() => {});
    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
  }

  private html(context: vscode.ExtensionContext) {
    const token = nonce();
    const assets = extensionAssetUris(context, this.panel.webview);
    const styles = assets.styles.map((uri) => `<link rel="stylesheet" href="${uri}">`).join('\n');
    const contentSecurityPolicy = studioWebviewContentSecurityPolicy(this.panel.webview.cspSource, token);
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
    ${styles}
    <title>TopoViewer Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" nonce="${token}" src="${assets.script}"></script>
  </body>
</html>`;
  }

  private async handleMessage(message: unknown) {
    const request = parseStudioHostRequest(message);
    if (request) {
      const response: StudioHostResponseMessage = {
        id: request.id,
        result: await dispatchStudioHostRequest(this.host, request),
        type: 'studio:host-response'
      };
      await this.panel.webview.postMessage(response);
      return;
    }
    const report = parseStudioHostReport(message);
    if (report) {
      this.host.report(report.event);
      return;
    }
    const candidate = message as { id?: unknown; type?: unknown } | undefined;
    if (candidate?.type === 'studio:host-request' && typeof candidate.id === 'string') {
      const response: StudioHostResponseMessage = {
        id: candidate.id.slice(0, 128),
        result: {
          error: { code: 'invalid-request', message: 'The VS Code host rejected an invalid Studio message.', retryable: false },
          ok: false
        },
        type: 'studio:host-response'
      };
      await this.panel.webview.postMessage(response);
    }
  }

  dispose() {
    this.unwatch();
    this.disposables.splice(0).forEach((disposable) => disposable.dispose());
  }
}

async function openStudio(context: vscode.ExtensionContext, output: vscode.OutputChannel, viewColumn: vscode.ViewColumn) {
  const active = vscode.window.activeTextEditor?.document.uri;
  if (!active) {
    void vscode.window.showWarningMessage('Open a TopoViewer topology, stylesheet, or mapper YAML file first.');
    return;
  }
  let uris: BundleUris;
  try {
    uris = pairedUris(active);
    assertTrustedBundleRoot(active, bundleRoot(uris.topology));
  } catch (error) {
    void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
    return;
  }
  const panel = vscode.window.createWebviewPanel(
    'topoviewer.studio',
    'TopoViewer Studio',
    viewColumn,
    { enableScripts: true, retainContextWhenHidden: true }
  );
  try {
    new TopoViewerStudioPanel(context, panel, output, uris);
  } catch (error) {
    panel.dispose();
    void vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
  }
}

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel('TopoViewer Studio', { log: true });
  context.subscriptions.push(
    output,
    vscode.commands.registerCommand('topoviewer.openPreview', () => openStudio(context, output, vscode.ViewColumn.Active)),
    vscode.commands.registerCommand('topoviewer.openPreviewToSide', () => openStudio(context, output, vscode.ViewColumn.Beside))
  );
}

export function deactivate() {}
