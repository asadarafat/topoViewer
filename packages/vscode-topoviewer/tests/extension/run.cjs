const assert = require('node:assert/strict');
const vscode = require('vscode');

async function waitFor(predicate, timeout = 10_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for the VS Code Studio integration state.');
}

exports.run = async function run() {
  const extension = vscode.extensions.getExtension('asadarafat.vscode-topoviewer');
  assert.ok(extension, 'VS Code did not discover the TopoViewer extension.');
  await extension.activate();

  const commands = await vscode.commands.getCommands(true);
  assert.ok(commands.includes('topoviewer.openPreview'));
  assert.ok(commands.includes('topoviewer.openPreviewToSide'));

  const topology = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'topology.yaml');
  const document = await vscode.workspace.openTextDocument(topology);
  await vscode.window.showTextDocument(document);
  const startup = Date.now();
  await vscode.commands.executeCommand('topoviewer.openPreview');

  const tab = await waitFor(() => vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .find((candidate) => candidate.label === 'TopoViewer Studio'));
  assert.equal(tab.label, 'TopoViewer Studio');
  assert.ok(Date.now() - startup < 5_000, 'VS Code Studio webview startup exceeded 5 seconds.');
  assert.equal(extension.isActive, true);
  console.log('VS Code Studio extension host: activation, commands, workspace, and webview passed.');
};
