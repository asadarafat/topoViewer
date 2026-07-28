import { expect, test, type Locator, type Page } from '@playwright/test';
import { openMapperCode, openPropertiesCodeDocument, openStudioWorkspace } from '../support/workspaceRail';
import { expectEditorContains } from './helpers/monaco';

async function openStyleYaml(page: Page) {
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const workspace = await openStudioWorkspace(page, 'Properties');
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();
  return workspace;
}

async function replaceCandidate(page: Page, workspace: Locator, source: string) {
  const editor = workspace.getByLabel('stylesheet YAML editor');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await editor.evaluate((element, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', value);
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData
      })
    );
  }, source);
  return editor;
}

function suggestionWidget(workspace: Locator) {
  return workspace.locator('.suggest-widget.visible');
}

async function requestYamlContextHelp(page: Page, workspace: Locator, document: 'stylesheet' | 'topology', expectedSuggestion: string) {
  const editor = workspace.getByLabel(`${document} YAML editor`);
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await workspace.getByRole('button', { name: 'Show YAML context help' }).click();
  await expect(suggestionWidget(workspace)).toContainText(expectedSuggestion);
  await page.keyboard.press('Escape');
}

test('exposes shared contextual YAML help for topology, stylesheet, and mapper documents', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');

  const topology = await openPropertiesCodeDocument(page, 'topology');
  await requestYamlContextHelp(page, topology, 'topology', 'graph');

  const stylesheet = await openPropertiesCodeDocument(page, 'stylesheet');
  await requestYamlContextHelp(page, stylesheet, 'stylesheet', '$schema');

  const mapper = await openMapperCode(page);
  await expectEditorContains(page, 'mapper', 'id');
  await mapper.getByRole('button', { name: 'Show YAML context help' }).click();
  await expect(page.locator('.monaco-hover[role="tooltip"]')).toContainText('Optional stable condition identifier');
});

test('lazy loads embedded Monaco and exposes target-aware property, value, and selector completion', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await expect(page.locator('.monaco-editor')).toHaveCount(0);

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const workspace = await openStudioWorkspace(page, 'Properties');
  await expect(page.locator('.monaco-editor')).toHaveCount(0);
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();

  await replaceCandidate(page, workspace, ['stylesheet:', '  - selector: node', '    style:', '      back'].join('\n'));
  await page.keyboard.press('Control+Space');
  await expect(suggestionWidget(workspace)).toContainText('backgroundColor');
  await expect(suggestionWidget(workspace)).not.toContainText('curveStyle');
  await page.keyboard.press('Escape');

  await replaceCandidate(page, workspace, ['stylesheet:', '  - selector: node', '    style:', '      shape: rou'].join('\n'));
  await page.keyboard.press('Control+Space');
  await expect(suggestionWidget(workspace)).toContainText('roundRectangle');
  await page.keyboard.press('Escape');

  await replaceCandidate(page, workspace, 'stylesheet:\n  - selector: ');
  await page.keyboard.press('Control+Space');
  await expect(suggestionWidget(workspace)).toContainText('node[id = "leaf1"]');
  await page.keyboard.press('Escape');

  const editor = await replaceCandidate(page, workspace, 'icons:\n  spur:\n    svg: |\n      <svg viewBox="0 0 24 24"></svg>\n    ');
  await editor.press('?');
  await expect(suggestionWidget(workspace)).toContainText('glyph');
  await expect(suggestionWidget(workspace)).toContainText('stroke');
  await expect(suggestionWidget(workspace)).not.toContainText('Inline SVG icon');
  await page.keyboard.press('Escape');

  const layoutEditor = await replaceCandidate(page, workspace, 'layout:\n  ');
  await layoutEditor.press('?');
  await expect(suggestionWidget(workspace)).toContainText('mode');
  await expect(suggestionWidget(workspace)).toContainText('clos');
  await page.keyboard.press('Escape');

  const nestedEditor = await replaceCandidate(page, workspace, ['stylesheet:', '  - selector: node', '    style:', '      nodeLayout:', '        icon:', '          '].join('\n'));
  await nestedEditor.press('?');
  await expect(suggestionWidget(workspace)).toContainText('placement');
  await expect(suggestionWidget(workspace)).toContainText('width');
});

test('keeps Style Code search, rule navigation, format warning, and diagnostics connected', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const workspace = await openStudioWorkspace(page, 'Properties');
  await workspace.getByRole('searchbox', { name: 'Search style attributes' }).fill('background color');
  const color = workspace.locator('.studio-basic-style-field[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#123456');
  await color.press('Enter');
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();

  const matchingRule = workspace.getByRole('button', { name: 'Go to matching object rule' });
  await expect(matchingRule).toBeEnabled();
  await matchingRule.click();
  await workspace.getByRole('button', { name: 'Search Style YAML' }).click();
  const editor = workspace.getByLabel('stylesheet YAML editor');
  const editorSurface = editor.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " monaco-editor ")][1]');
  await expect(editorSurface.getByRole('textbox', { name: 'Find', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(workspace.getByRole('button', { name: /source (drawer|workspace)/i })).toHaveCount(0);

  await workspace.getByRole('button', { name: 'Format Style YAML' }).click();
  const format = page.getByRole('dialog', { name: 'Format candidate stylesheet?' });
  await expect(format).toContainText('normalize indentation, quoting, and flow-style YAML');
  await format.getByRole('button', { name: 'Cancel' }).click();

  await replaceCandidate(page, workspace, 'stylesheet:\n  - selector: node\n    style: [');
  await expect(workspace.getByLabel('Style diagnostics')).toContainText(/Line \d+:/);
  await expect(workspace.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
});

test('contains an embedded editor failure while Basic and canvas remain usable', async ({ page }) => {
  await page.goto('/?__studio-test-state=editor-error');
  await (await openStudioWorkspace(page, 'Add')).getByTestId('palette-router').click();
  const workspace = await openStudioWorkspace(page, 'Properties');
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();

  await expect(workspace.getByRole('alert')).toContainText('Enhanced YAML editing is unavailable');
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Visual' }).click();
  await expect(workspace.getByRole('searchbox', { name: 'Search style attributes' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
});

test('keeps protected question marks byte-identical while discovery remains available', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await openStyleYaml(page);
  const protectedSource = ['stylesheet:', '  # ? remains in a comment', '  - selector: node', '    style:', '      label: "what ?"', '      icon: https://example.test/a?b', ''].join('\n');
  await replaceCandidate(page, workspace, protectedSource);
  await expectEditorContains(page, 'stylesheet', '# ? remains in a comment');
  await expectEditorContains(page, 'stylesheet', 'label: "what ?"');
  await expectEditorContains(page, 'stylesheet', 'https://example.test/a?b');
});
