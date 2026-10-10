import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(directory, e.name)) : [path.join(directory, e.name)]);
}
for (const host of ['mkdocs', 'zensical']) {
  const directory = path.join(root, 'site/docs', host);
  if (!fs.existsSync(directory)) throw new Error(`Missing built documentation: ${host}`);
  fs.writeFileSync(path.join(directory, 'documentation-build.json'), JSON.stringify({ channel: 'development', revision, releasedRecipes: '0.5.0', primaryHost: 'mkdocs' }, null, 2));
  if (host === 'zensical') for (const file of files(directory).filter((file) => file.endsWith('.html'))) {
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, source.replace(/(<link[^>]*rel="canonical"[^>]*href=")([^"]+)(")/g, (_, before, url, after) => `${before}${url.replace('/docs/zensical/', '/docs/mkdocs/')}${after}`));
  }
}
