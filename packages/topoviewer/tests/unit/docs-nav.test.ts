import fs from 'node:fs';
import path from 'node:path';
import * as YAML from 'js-yaml';
import { describe, expect, it } from 'vitest';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function navigationRoutes(value: unknown): string[] {
  if (typeof value === 'string') return [value.split('#')[0]];
  if (Array.isArray(value)) return value.flatMap(navigationRoutes);
  return Object.values(record(value)).flatMap(navigationRoutes);
}

function missingRoutes(navigation: unknown, requiredRoutes: string[]): string[] {
  const actual = new Set(navigationRoutes(navigation));
  return requiredRoutes.filter((route) => !actual.has(route));
}

describe('MkDocs navigation', () => {
  it('links public categories and scenarios within Examples, and integrations within Integrate', () => {
    const packageRoot = process.cwd();
    const repoRoot = path.resolve(packageRoot, '../..');
    const catalog = record(YAML.load(fs.readFileSync(path.join(packageRoot, 'content/examples/catalog.yaml'), 'utf8')));
    const mkdocs = record(YAML.load(fs.readFileSync(path.join(repoRoot, 'mkdocs.yml'), 'utf8')));

    const features = new Set(
      (catalog.examples as Array<{ feature?: string; publicPage?: boolean }> | undefined || [])
        .filter((example) => example.publicPage !== false)
        .map((example) => example.feature)
        .filter((feature): feature is string => typeof feature === 'string' && !['harness', 'integration'].includes(feature))
    );
    const gallery = JSON.parse(fs.readFileSync(path.join(packageRoot, 'content/gallery.json'), 'utf8')) as { featured: Array<{ page: string }> };
    const requiredRoutes = [
      'topoviewer/examples/index.md',
      ...[...features].map((feature) => `topoviewer/examples/${feature}/index.md`),
      ...gallery.featured.map((card) => card.page)
    ];
    const examplesNav = (mkdocs.nav as Array<Record<string, unknown>> | undefined || [])
      .find((entry) => Object.prototype.hasOwnProperty.call(entry, 'Examples'))?.Examples;

    expect(missingRoutes(examplesNav, requiredRoutes)).toEqual([]);
    const integrateNav = (mkdocs.nav as Array<Record<string, unknown>> | undefined || [])
      .find((entry) => Object.prototype.hasOwnProperty.call(entry, 'Integrate'))?.Integrate;
    expect(missingRoutes(integrateNav, [
      'topoviewer/examples/use-cases/index.md',
      'topoviewer/examples/use-cases/react.md',
      'topoviewer/examples/use-cases/mkdocs.md',
      'topoviewer/examples/use-cases/static-html-zensical-adapter.md'
    ])).toEqual([]);
    const localRoutes = navigationRoutes(examplesNav).filter((route) => route.endsWith('.md') && !/^[a-z]+:/i.test(route));
    expect(localRoutes.filter((route) => !fs.existsSync(path.join(repoRoot, 'docs', route)))).toEqual([]);
  });

  it('accepts nested sections and renamed labels while checking actual destinations', () => {
    const navigation = [{ 'Browse by technique': [{ 'Deeper section': [{ 'Device cards': 'topoviewer/examples/nodes/index.md#cards' }] }] }];
    expect(missingRoutes(navigation, ['topoviewer/examples/nodes/index.md'])).toEqual([]);
  });

  it('rejects a missing category or scenario even when its old label remains', () => {
    const navigation = [{ 'Pattern Library': [{ Nodes: 'topoviewer/examples/edges/index.md' }] }, { 'Guided Scenarios': [] }];
    expect(missingRoutes(navigation, [
      'topoviewer/examples/nodes/index.md',
      'topoviewer/examples/use-cases/service-provider-network.md'
    ])).toEqual([
      'topoviewer/examples/nodes/index.md',
      'topoviewer/examples/use-cases/service-provider-network.md'
    ]);
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
