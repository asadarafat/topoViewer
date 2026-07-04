import fs from 'node:fs';
import path from 'node:path';
import YAML from 'js-yaml';
import { describe, expect, it } from 'vitest';

function featureTitle(feature: string): string {
  return feature
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function navValue(entry: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(entry, key) ? entry[key] : undefined;
}

describe('MkDocs navigation', () => {
  it('lists every public example category in the Examples nav', () => {
    const packageRoot = process.cwd();
    const repoRoot = path.resolve(packageRoot, '../..');
    const catalog = record(YAML.load(fs.readFileSync(path.join(packageRoot, 'content/examples/catalog.yaml'), 'utf8')));
    const mkdocs = record(YAML.load(fs.readFileSync(path.join(repoRoot, 'mkdocs.yml'), 'utf8')));

    const expectedCategories = new Set(
      (catalog.examples as Array<{ feature?: string }> | undefined || [])
        .map((example) => example.feature)
        .filter((feature): feature is string => typeof feature === 'string' && !['harness', 'integration'].includes(feature))
        .map(featureTitle)
    );
    const examplesNav = (mkdocs.nav as Array<Record<string, unknown>> | undefined || [])
      .find((entry) => Object.prototype.hasOwnProperty.call(entry, 'Examples'))?.Examples as Array<Record<string, string>> | undefined;
    const directExampleCategories = (examplesNav || [])
      .filter((entry) => {
        const [label, value] = Object.entries(entry)[0] || [];
        return typeof label === 'string'
          && typeof value === 'string'
          && value === `topoviewer/examples/${label.toLowerCase().replace(/ /g, '-')}/index.md`;
      });
    const actualCategories = new Set(directExampleCategories.flatMap((entry) => Object.keys(entry)));

    expect([...expectedCategories].filter((category) => !actualCategories.has(category))).toEqual([]);
    expect(navValue((examplesNav || [])[0] || {}, 'Overview')).toBe('topoviewer/examples/index.md');
    expect((examplesNav || []).some((entry) => Array.isArray(navValue(entry, 'Use Cases')))).toBe(true);
  });

  it('documents every top-level MkDocs/Zensical embed block option from the schema', () => {
    const packageRoot = process.cwd();
    const repoRoot = path.resolve(packageRoot, '../..');
    const schema = record(JSON.parse(fs.readFileSync(path.join(packageRoot, 'schemas/topoviewer-mkdocs-block.schema.json'), 'utf8')));
    const properties = record(schema.properties);
    const documented = [
      fs.readFileSync(path.join(packageRoot, 'content/pages/examples/use-cases/mkdocs.md'), 'utf8'),
      fs.readFileSync(path.join(packageRoot, 'content/pages/examples/use-cases/static-html-zensical-adapter.md'), 'utf8'),
      fs.readFileSync(path.join(repoRoot, 'docs/topoviewer/examples/use-cases/mkdocs.md'), 'utf8'),
      fs.readFileSync(path.join(repoRoot, 'docs/topoviewer/examples/use-cases/static-html-zensical-adapter.md'), 'utf8')
    ].join('\n');

    const publicOptions = Object.keys(properties).filter((key) => key !== '$schema');
    const missing = publicOptions.filter((key) => !documented.includes(`\`${key}\``));

    expect(missing).toEqual([]);
  });
});
