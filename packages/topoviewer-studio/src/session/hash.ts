import type { StudioProject } from '../contracts/project';

export function stableTextHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function stableProjectSourceRevision(project: StudioProject): string {
  const content = (['topology', 'stylesheet', 'mapper'] as const)
    .map((kind) => `${kind}:${project.documents[kind]?.text || ''}`)
    .join('\u0000');
  return `source-${stableTextHash(content)}`;
}
