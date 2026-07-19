import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const assets = [
  'features/canvas/canvas.css',
  'features/inspector/edit-workspace.css',
  'styles/base.css',
  'styles/studio.css'
];

for (const asset of assets) {
  const destination = path.join(root, 'dist', asset);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, 'src', asset), destination);
}
