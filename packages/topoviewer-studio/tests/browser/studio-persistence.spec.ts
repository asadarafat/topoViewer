import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { decodeStudioProjectArchive, encodeStudioProjectArchive } from '../../src/archive/projectArchive';
import { createStarterProject } from '../../src/hosts/starterProject';
import { openEditCodeDocument } from '../support/workspaceRail';
import { invokeStudioHeaderAction } from '../support/headerActions';

async function recoveryCount(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const request = indexedDB.open('topoviewer-studio');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('recoveries', 'readonly');
          const count = transaction.objectStore('recoveries').count();
          count.onsuccess = () => resolve(count.result);
          count.onerror = () => reject(count.error);
          transaction.oncomplete = () => database.close();
        };
      })
  );
}

test('autosaves a modified browser project and restores it as recovery after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await expect.poll(() => recoveryCount(page), { timeout: 5_000 }).toBeGreaterThan(0);
  const localEntries = await page.evaluate(() => Object.entries(localStorage));
  expect(localEntries.map(([key]) => key).sort()).toEqual(['topoviewer-studio:preference:v1:canvas-display', 'topoviewer-studio:preference:v1:workspace-panel-ratio']);
  for (const [, value] of localEntries) {
    expect(value).not.toContain('topology.yaml');
    expect(value).not.toContain('stylesheet.yaml');
  }

  await page.reload();
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await expect(page.locator('.studio-saved-state')).toHaveText('Recovery');
});

test('creates, renames, duplicates, opens, and deletes browser projects from one compact menu', async ({ page }) => {
  await page.goto('/');
  const projectButton = page.getByRole('button', { name: 'Project menu' });
  await projectButton.click();
  let menu = page.getByRole('dialog', { name: 'Project menu' });
  await expect(menu.getByRole('list', { name: 'Recent projects' }).getByRole('listitem')).toHaveCount(1);

  await menu.getByRole('button', { name: 'New' }).click();
  await projectButton.click();
  menu = page.getByRole('dialog', { name: 'Project menu' });
  await expect(menu.getByRole('list', { name: 'Recent projects' }).getByRole('listitem')).toHaveCount(2);
  await menu.getByRole('button', { name: 'Rename' }).click();
  await menu.getByRole('textbox', { name: 'Project name' }).fill('Edge Lab');
  await menu.getByRole('button', { name: 'Apply' }).click();
  await expect(projectButton).toContainText('Edge Lab');

  await projectButton.click();
  menu = page.getByRole('dialog', { name: 'Project menu' });
  await menu.getByRole('button', { name: 'Duplicate' }).click();
  await expect(projectButton).toContainText('Edge Lab copy');
  await projectButton.click();
  menu = page.getByRole('dialog', { name: 'Project menu' });
  await expect(menu.getByRole('list', { name: 'Recent projects' }).getByRole('listitem')).toHaveCount(3);
  await menu.getByRole('button', { name: 'Delete' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Edge Lab copy?' });
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await expect(projectButton).not.toContainText('Edge Lab copy');

  await page.reload();
  await expect(projectButton).toBeVisible();
  await expect(projectButton).not.toContainText('Edge Lab copy');
});

test('opens a deterministic portable project archive through the host picker', async ({ page }) => {
  const project = createStarterProject({ id: 'imported-project', name: 'Imported topology' });
  const archive = encodeStudioProjectArchive(project);
  await page.goto('/');
  await page.getByRole('button', { name: 'Project menu' }).click();
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('dialog', { name: 'Project menu' }).getByRole('button', { name: 'Open archive' }).click()]);
  await chooser.setFiles({ buffer: Buffer.from(archive), mimeType: 'application/zip', name: 'portable.tvstudio' });

  await expect(page.getByRole('button', { name: 'Project menu' })).toContainText('Imported topology');
  await expect(page.locator('.react-flow__renderer')).toBeVisible();
});

test('exports the current unsaved session snapshot as a portable archive', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.getByRole('button', { name: 'Project menu' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog', { name: 'Project menu' }).getByRole('button', { name: 'Export archive' }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.tvstudio$/);
  const path = await download.path();
  if (!path) throw new Error('Archive download has no local path.');
  const archive = decodeStudioProjectArchive(new Uint8Array(await readFile(path)));
  expect(archive.project.documents.topology.text).toContain('id: router-1');
});

test('restores an invalid YAML draft while keeping the last valid canvas projection', async ({ page }) => {
  await page.goto('/');
  let edit = await openEditCodeDocument(page, 'topology');
  const editor = edit.getByLabel('topology YAML editor');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await edit.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect.poll(() => recoveryCount(page), { timeout: 5_000 }).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(page.locator('.react-flow__renderer')).toBeVisible();
  edit = await openEditCodeDocument(page, 'topology');
  await expect(edit.getByRole('button', { name: 'Revert invalid draft' })).toBeVisible();
});

test('surfaces quota failure with retry while preserving dirty work', async ({ page }) => {
  await page.goto('/?__studio-test-state=storage-quota');
  await page.getByTestId('palette-router').click();
  const failure = page.getByRole('alert').filter({ hasText: 'Recovery save failed' });
  await expect(failure).toContainText('quota', { timeout: 5_000 });
  await expect(failure.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
});

test('contains an interrupted explicit save and leaves the project editable', async ({ page }) => {
  await page.goto('/?__studio-test-state=storage-interrupted');
  await page.getByTestId('palette-router').click();
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Save failed' })).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await page.getByTestId('palette-router').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
});

test('contains a corrupt persisted record and offers explicit reset without blanking the canvas', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('topoviewer-studio');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('projects', 'readwrite');
          const store = transaction.objectStore('projects');
          const all = store.getAll();
          all.onsuccess = () => {
            const record = all.result[0];
            store.put({ ...record, project: { corrupt: true } });
          };
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      })
  );

  await invokeStudioHeaderAction(page, 'Reload project');
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await page.getByRole('button', { name: 'Project menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Project menu' });
  await expect(menu.getByRole('alert')).toContainText('corrupt');
  await menu.getByRole('button', { name: 'Reset browser storage' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Reset browser storage?' });
  await confirmation.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByRole('button', { name: 'Project menu' })).toContainText('Backbone topology');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});
