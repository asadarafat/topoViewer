import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioExportRequest,
  StudioHostEvent
} from 'topoviewer-studio/host';
import type { StudioRecoverySnapshot } from 'topoviewer-studio';
import type {
  WorkspaceFileEntry,
  WorkspaceFileWrite,
  WorkspaceStudioPort
} from './workspaceStudioHost';

const MAX_FILES = 257;

function relativePath(root: vscode.Uri, uri: vscode.Uri): string | undefined {
  if (root.scheme !== uri.scheme || root.authority !== uri.authority) return undefined;
  const relative = path.posix.relative(root.path, uri.path).replaceAll('\\', '/');
  if (!relative || relative === '..' || relative.startsWith('../') || path.posix.isAbsolute(relative)) return undefined;
  return relative;
}

function mediaType(fileName: string): string {
  switch (path.extname(fileName).toLowerCase()) {
    case '.svg': return 'image/svg+xml';
    case '.gif': return 'image/gif';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.yaml':
    case '.yml': return 'application/yaml';
    case '.json': return 'application/json';
    case '.zip':
    case '.tvstudio': return 'application/zip';
    default: return 'application/octet-stream';
  }
}

function acceptedExtensions(accepted: string[]): string[] {
  const known: Record<string, string> = {
    'application/json': 'json',
    'application/zip': 'zip',
    'application/yaml': 'yaml',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp'
  };
  return [...new Set(accepted.flatMap((value) => {
    const extension = known[value] || (value.startsWith('.') ? value.slice(1) : undefined);
    return extension && /^[a-z0-9]+$/i.test(extension) ? [extension] : [];
  }))];
}

function plainFileName(candidate: string): string {
  const name = path.basename(candidate).replace(/[^a-zA-Z0-9._-]+/g, '-');
  return name || 'topoviewer-export';
}

export interface VsCodeWorkspacePortOptions {
  context: vscode.ExtensionContext;
  output: vscode.OutputChannel;
  root: vscode.Uri;
}

export class VsCodeWorkspacePort implements WorkspaceStudioPort {
  readonly id: string;
  readonly name: string;
  private readonly context: vscode.ExtensionContext;
  private readonly output: vscode.OutputChannel;
  private readonly root: vscode.Uri;

  constructor(options: VsCodeWorkspacePortOptions) {
    this.context = options.context;
    this.output = options.output;
    this.root = options.root;
    this.id = this.root.toString(true);
    this.name = path.posix.basename(this.root.path) || 'TopoViewer workspace';
  }

  get trusted() {
    return vscode.workspace.isTrusted;
  }

  async chooseAssets(request: StudioAssetRequest): Promise<StudioAssetContent[]> {
    const extensions = acceptedExtensions(request.accept);
    const selected = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: request.multiple,
      defaultUri: this.root,
      ...(extensions.length ? { filters: { 'Supported assets': extensions } } : {}),
      openLabel: request.multiple ? 'Add assets' : 'Add asset'
    });
    if (!selected?.length) {
      const error = new Error('Asset selection was cancelled.') as Error & { code?: string };
      error.code = 'cancelled';
      throw error;
    }
    return Promise.all(selected.map(async (uri) => ({
      bytes: await vscode.workspace.fs.readFile(uri),
      mediaType: mediaType(uri.path),
      name: path.posix.basename(uri.path)
    })));
  }

  copyText(text: string): Promise<void> {
    return Promise.resolve(vscode.env.clipboard.writeText(text));
  }

  async exportArtifact(request: StudioExportRequest): Promise<void> {
    const fileName = plainFileName(request.suggestedName);
    const extension = path.extname(fileName).replace('.', '') || 'bin';
    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.joinPath(this.root, fileName),
      filters: { [request.kind]: [extension] },
      saveLabel: 'Export TopoViewer artifact'
    });
    if (!target) {
      const error = new Error('Export was cancelled.') as Error & { code?: string };
      error.code = 'cancelled';
      throw error;
    }
    await vscode.workspace.fs.writeFile(target, Uint8Array.from(request.artifact.bytes));
    void vscode.window.showInformationMessage(`Exported ${path.posix.basename(target.path)}.`);
  }

  async listFiles(): Promise<WorkspaceFileEntry[]> {
    const uris = await vscode.workspace.findFiles(new vscode.RelativePattern(this.root, '**/*'), '**/{node_modules,.git,dist,site}/**', MAX_FILES);
    const entries: WorkspaceFileEntry[] = [];
    for (const uri of uris) {
      const relative = relativePath(this.root, uri);
      if (!relative) continue;
      const stat = await vscode.workspace.fs.stat(uri);
      const symbolicLink = Boolean(stat.type & vscode.FileType.SymbolicLink);
      if (!symbolicLink && !(stat.type & vscode.FileType.File)) continue;
      entries.push({
        mediaType: mediaType(relative),
        modifiedAt: new Date(stat.mtime).toISOString(),
        path: relative,
        size: stat.size,
        ...(symbolicLink ? { symbolicLink: true } : {})
      });
    }
    return entries.sort((left, right) => left.path.localeCompare(right.path));
  }

  readFile(filePath: string): Promise<Uint8Array> {
    return Promise.resolve(vscode.workspace.fs.readFile(this.uri(filePath)));
  }

  readPreference<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.context.workspaceState.get<T>(this.stateKey('preference', key)));
  }

  readRecovery(): Promise<StudioRecoverySnapshot | undefined> {
    return Promise.resolve(this.context.workspaceState.get<StudioRecoverySnapshot>(this.stateKey('recovery')));
  }

  report(event: StudioHostEvent): void {
    this.output.appendLine(`[${event.category}] ${event.name}${event.detail ? ` ${JSON.stringify(event.detail)}` : ''}`);
  }

  watch(listener: (paths: string[]) => void): () => void {
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.root, '**/*'));
    const subscriptions = [
      watcher.onDidChange((uri) => this.emitUri(uri, listener)),
      watcher.onDidCreate((uri) => this.emitUri(uri, listener)),
      watcher.onDidDelete((uri) => this.emitUri(uri, listener))
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.dispose());
      watcher.dispose();
    };
  }

  async writeFilesAtomically(files: WorkspaceFileWrite[]): Promise<void> {
    const transaction = crypto.randomBytes(8).toString('hex');
    const staged: Array<{ target: vscode.Uri; temporary: vscode.Uri }> = [];
    const backups = new Map<string, Uint8Array | undefined>();
    try {
      for (const file of files) {
        const target = this.uri(file.path);
        const temporary = target.with({ path: `${target.path}.topoviewer-${transaction}.tmp` });
        let backup: Uint8Array | undefined;
        try {
          backup = await vscode.workspace.fs.readFile(target);
        } catch (error) {
          if (!(error instanceof vscode.FileSystemError && error.code === 'FileNotFound')) throw error;
        }
        backups.set(target.toString(true), backup);
        await vscode.workspace.fs.writeFile(temporary, Uint8Array.from(file.bytes));
        staged.push({ target, temporary });
      }
      for (const file of staged) await vscode.workspace.fs.rename(file.temporary, file.target, { overwrite: true });
    } catch (error) {
      for (const file of staged) {
        const backup = backups.get(file.target.toString(true));
        try {
          if (backup) await vscode.workspace.fs.writeFile(file.target, backup);
          else await vscode.workspace.fs.delete(file.target, { useTrash: false });
        } catch (rollbackError) {
          this.output.appendLine(`Atomic-save rollback failed for ${file.target.toString(true)}: ${String(rollbackError)}`);
        }
      }
      throw error;
    } finally {
      for (const file of staged) {
        try {
          await vscode.workspace.fs.delete(file.temporary, { useTrash: false });
        } catch {
          // The temporary file was renamed or already removed.
        }
      }
    }
  }

  writePreference<T>(key: string, value: T): Promise<void> {
    return Promise.resolve(this.context.workspaceState.update(this.stateKey('preference', key), value));
  }

  writeRecovery(snapshot: StudioRecoverySnapshot): Promise<void> {
    return Promise.resolve(this.context.workspaceState.update(this.stateKey('recovery'), snapshot));
  }

  private emitUri(uri: vscode.Uri, listener: (paths: string[]) => void) {
    const relative = relativePath(this.root, uri);
    if (relative) listener([relative]);
  }

  private stateKey(kind: 'preference' | 'recovery', key = ''): string {
    return `topoviewer.studio.${kind}:${this.id}${key ? `:${key}` : ''}`;
  }

  private uri(filePath: string): vscode.Uri {
    const normalized = filePath.replaceAll('\\', '/');
    if (!normalized || normalized.startsWith('/') || normalized.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
      throw new Error(`Workspace path "${filePath}" is outside the TopoViewer bundle root.`);
    }
    const uri = vscode.Uri.joinPath(this.root, ...normalized.split('/'));
    if (!relativePath(this.root, uri)) throw new Error(`Workspace path "${filePath}" is outside the TopoViewer bundle root.`);
    return uri;
  }
}

export function bundleRoot(uri: vscode.Uri): vscode.Uri {
  return uri.with({ path: path.posix.dirname(uri.path) });
}

export function relativeBundlePath(root: vscode.Uri, uri: vscode.Uri): string {
  const relative = relativePath(root, uri);
  if (!relative) throw new Error(`URI ${uri.toString(true)} is outside bundle root ${root.toString(true)}.`);
  return relative;
}
