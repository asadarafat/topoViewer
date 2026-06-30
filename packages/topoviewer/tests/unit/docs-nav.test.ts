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
    const catalog = record(YAML.load(fs.readFileSync(path.join(packageRoot, 'examples/test-cases/catalog.yaml'), 'utf8')));
    const mkdocs = record(YAML.load(fs.readFileSync(path.join(repoRoot, 'mkdocs.yml'), 'utf8')));

    const expectedCategories = new Set(
      (catalog.examples as Array<{ feature?: string }> | undefined || [])
        .map((example) => example.feature)
        .filter((feature): feature is string => Boolean(feature) && feature !== 'integration')
        .map(featureTitle)
    );
    const examplesNav = (mkdocs.nav as Array<Record<string, unknown>> | undefined || [])
      .find((entry) => Object.prototype.hasOwnProperty.call(entry, 'Examples'))?.Examples as Array<Record<string, string>> | undefined;
    const generatedCatalog = (examplesNav || [])
      .map((entry) => navValue(entry, 'Generated Catalog'))
      .find((value): value is Array<Record<string, string>> => Array.isArray(value));
    const actualCategories = new Set((generatedCatalog || []).flatMap((entry) => Object.keys(entry)));

    expect([...expectedCategories].filter((category) => !actualCategories.has(category))).toEqual([]);
    expect(navValue((examplesNav || [])[0] || {}, 'Curated Examples')).toBe('topoviewer/examples.md');
  });
});
