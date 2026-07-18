interface NodeLayoutSuggestion {
  detail?: string;
  documentation?: string;
  insertText?: string;
  kind: 'key' | 'reference' | 'selector' | 'snippet' | 'value';
  label: string;
}

interface NodeLayoutRequest {
  column: number;
  lineNumber: number;
  text: string;
}

export const nodeLayoutKeyDocumentation: Record<string, string> = {
  align: 'Horizontal alignment for card content text.',
  content: 'Card text content configuration.',
  direction: 'Card layout direction. Horizontal cards place the icon beside text content.',
  height: 'Card icon box height in pixels.',
  icon: 'Card icon box configuration.',
  placement: 'Card icon placement relative to text content.',
  subtitleField: 'Node field path used as the card subtitle.',
  titleField: 'Node field path used as the card title.',
  type: 'Node layout type. Use card for an internal card layout inside a roundRectangle node.',
  width: 'Card icon box width in pixels.'
};

const integerValueSuggestions = ['0', '1', '2', '4', '8', '12', '16', '24', '32', '48', '64', '96'];

function lineAt(text: string, lineNumber: number) {
  return text.split(/\r?\n/)[Math.max(0, lineNumber - 1)] || '';
}

function linePrefix(text: string, lineNumber: number, column: number) {
  return lineAt(text, lineNumber).slice(0, Math.max(0, column - 1));
}

function yamlPathAtLine(text: string, lineNumber: number) {
  const stack: Array<{ indent: number; key: string }> = [];
  text.split(/\r?\n/).slice(0, Math.max(0, lineNumber)).forEach((line) => {
    const match = line.match(/^(\s*)(?:-\s*)?([A-Za-z][A-Za-z0-9_]*)\s*:/);
    if (!match) return;
    const indent = match[1]?.length || 0;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    stack.push({ indent, key: match[2] });
  });
  return stack.map((entry) => entry.key);
}

function isKeyContext(request: NodeLayoutRequest) {
  const prefix = linePrefix(request.text, request.lineNumber, request.column).trim();
  return prefix === '' || prefix === '-' || /^-?\s*[A-Za-z][A-Za-z0-9]*$/.test(prefix);
}

function referenceSuggestions(values: string[], detail: string): NodeLayoutSuggestion[] {
  return values.map((value) => ({
    detail,
    insertText: value,
    kind: 'reference',
    label: value
  }));
}

function nodeLayoutKeySuggestion(key: string): NodeLayoutSuggestion {
  return {
    detail: 'nodeLayout key',
    documentation: nodeLayoutKeyDocumentation[key] || `Card node layout ${key} setting.`,
    insertText: `${key}: `,
    kind: 'key',
    label: key
  };
}

function nodeLayoutPathContext(path: string[]) {
  if (!path.includes('nodeLayout')) return undefined;
  if (path.includes('icon')) return 'icon';
  if (path.includes('content')) return 'content';
  return 'root';
}

function nodeLayoutKeySuggestions(path: string[]): NodeLayoutSuggestion[] {
  const context = nodeLayoutPathContext(path);
  if (context === 'icon') return ['placement', 'width', 'height'].map(nodeLayoutKeySuggestion);
  if (context === 'content') return ['align', 'titleField', 'subtitleField'].map(nodeLayoutKeySuggestion);
  if (context === 'root') return ['type', 'direction', 'icon', 'content'].map(nodeLayoutKeySuggestion);
  return [];
}

function nodeLayoutFieldPathSuggestions(key: string): NodeLayoutSuggestion[] {
  const values = key === 'titleField'
    ? ['labels.name', 'id', 'data.title', 'data.subtitle', 'labels.role']
    : ['data.subtitle', 'data.description', 'labels.role', 'labels.status', 'data.owner'];
  return referenceSuggestions(values, `${key} field path`);
}

function nodeLayoutValueSuggestions(key: string): NodeLayoutSuggestion[] {
  if (key === 'type') return referenceSuggestions(['card'], 'nodeLayout type');
  if (key === 'direction') return referenceSuggestions(['horizontal'], 'nodeLayout direction');
  if (key === 'placement') return referenceSuggestions(['left'], 'Card icon placement');
  if (key === 'align') return referenceSuggestions(['left', 'center', 'right'], 'Card content alignment');
  if (key === 'width' || key === 'height') {
    return integerValueSuggestions.map((value) => ({
      detail: `${key} integer value`,
      documentation: `Card icon ${key} in pixels.`,
      insertText: value,
      kind: 'value',
      label: value
    }));
  }
  if (key === 'titleField' || key === 'subtitleField') return nodeLayoutFieldPathSuggestions(key);
  return [];
}

export function nodeLayoutStyleSuggestions(request: NodeLayoutRequest, key: string | undefined, prefix: string): NodeLayoutSuggestion[] | undefined {
  const path = yamlPathAtLine(request.text, request.lineNumber);
  if (!path.includes('nodeLayout') && key !== 'nodeLayout') return undefined;
  if (key && prefix.includes(':')) return nodeLayoutValueSuggestions(key);
  if (isKeyContext(request)) return nodeLayoutKeySuggestions(path);
  return [];
}
