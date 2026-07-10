import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'dist/app/studio.css');
await mkdir(path.dirname(destination), { recursive: true });
await copyFile(path.join(root, 'src/app/studio.css'), destination);
