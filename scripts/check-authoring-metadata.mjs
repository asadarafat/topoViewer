import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const authoring = await import(pathToFileURL(path.join(root, 'packages/topoviewer/dist/authoring.mjs')));
const issues = authoring.validateAuthoringMetadata();

if (issues.length > 0) {
  console.error(`Authoring metadata has ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue.code} ${issue.path}: ${issue.message}`);
  process.exit(1);
}

const styleByTarget = Object.fromEntries(
  Object.entries(authoring.styleAuthoringMetadataByTarget).map(([target, fields]) => [
    target,
    {
      total: fields.length,
      basic: fields.filter((field) => field.level === 'basic').length,
      advanced: fields.filter((field) => field.level === 'advanced').length,
      groups: [...new Set(fields.map((field) => field.group))].sort()
    }
  ])
);
const mapperByGroup = Object.fromEntries(
  [...new Set(authoring.mapperAuthoringMetadata.map((field) => field.group))]
    .sort()
    .map((group) => {
      const fields = authoring.mapperAuthoringMetadata.filter((field) => field.group === group);
      return [group, {
        total: fields.length,
        basic: fields.filter((field) => field.level === 'basic').length,
        advanced: fields.filter((field) => field.level === 'advanced').length
      }];
    })
);

const report = {
  generatedAt: new Date().toISOString(),
  mapper: {
    total: authoring.mapperAuthoringMetadata.length,
    groups: mapperByGroup
  },
  style: {
    canonicalDefinitions: authoring.styleAuthoringMetadata.length,
    conditionalFields: authoring.styleAuthoringMetadata.filter((field) => field.visibleWhen).length,
    nestedFields: authoring.styleAuthoringMetadata.reduce((count, field) => count + (field.nestedFields?.length || 0), 0),
    specializedEditors: [...new Set(authoring.styleAuthoringMetadata
      .flatMap((field) => [field.control?.specializedEditor, ...(field.nestedFields || []).map((nested) => nested.control?.specializedEditor)])
      .filter(Boolean))].sort(),
    byTarget: styleByTarget
  },
  validationIssues: issues
};

if (process.argv.includes('--json')) {
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const outputIndex = process.argv.indexOf('--output');
  if (outputIndex >= 0) {
    const output = process.argv[outputIndex + 1];
    if (!output) throw new Error('--output requires a file path.');
    fs.mkdirSync(path.dirname(path.resolve(root, output)), { recursive: true });
    fs.writeFileSync(path.resolve(root, output), serialized);
    console.log(`Wrote ${output}`);
  } else {
    console.log(serialized.trimEnd());
  }
} else {
  console.log(`Authoring metadata passed: ${report.style.canonicalDefinitions} style definitions, ${report.mapper.total} mapper fields.`);
}
