export type StylesheetStructureSection = 'layout' | 'layout.clos' | 'limits';

interface StylesheetStructureField {
  detail: string;
  documentation: string;
  insertText: string;
  label: string;
  values?: string[];
}

function field(label: string, detail: string, documentation: string, insertText: string, values?: string[]): StylesheetStructureField {
  return { detail, documentation, insertText, label, values };
}

export const stylesheetRootFields = [
  field('$schema', 'Stylesheet schema', 'Optional schema URI used by editors and validation tools.', '$schema: https://topoviewer.dev/schemas/topoviewer-stylesheet.schema.json'),
  field('version', 'Stylesheet version', 'Optional stylesheet document version.', 'version: "1"'),
  field('layout', 'Layout policy', 'Default manual, force, or CLOS layout policy.', 'layout:\n  mode: manual'),
  field('limits', 'Renderer limits', 'Optional document-level renderer safety limits.', 'limits:\n  maxNodes: 1200'),
  field('icons', 'Project icon registry', 'Named glyph, SVG, or image icons available to stylesheet rules.', 'icons:\n  icon-name:\n    glyph: ""'),
  field('labelFields', 'Label field order', 'Object field paths considered when deriving edge and path labels.', 'labelFields:\n  - labels.name'),
  field('stylesheet', 'Stylesheet rules', 'Ordered selector and style rules.', 'stylesheet:\n  - selector: node\n    style:\n      ')
];

export const stylesheetStructureFields: Record<StylesheetStructureSection, StylesheetStructureField[]> = {
  layout: [
    field('mode', 'Layout mode', 'Selects manual positioning, force layout, or topology-aware CLOS layout.', 'mode: ', ['manual', 'force', 'clos']),
    field('width', 'Layout width', 'Target layout width in pixels.', 'width: '),
    field('height', 'Layout height', 'Target layout height in pixels.', 'height: '),
    field('iterations', 'Force iterations', 'Maximum force-layout simulation iterations.', 'iterations: '),
    field('linkDistance', 'Force link distance', 'Preferred force-layout distance between linked nodes.', 'linkDistance: '),
    field('chargeStrength', 'Force charge strength', 'Repulsive force applied between nodes.', 'chargeStrength: '),
    field('collideRadius', 'Force collision radius', 'Collision radius used to keep force-layout nodes apart.', 'collideRadius: '),
    field('centerStrength', 'Force center strength', 'Strength used to pull the force layout toward its center.', 'centerStrength: '),
    field('inferLabelRole', 'Role-to-stage mapping', 'Optional role vocabulary used to infer CLOS stages.', 'inferLabelRole:\n    '),
    field('clos', 'CLOS layout options', 'Stage, direction, grouping, and spacing policy for CLOS layout.', 'clos:\n    ')
  ],
  'layout.clos': [
    field('direction', 'CLOS direction', 'Direction in which CLOS stages are arranged.', 'direction: ', ['topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft']),
    field('stageCount', 'CLOS stage count', 'Explicit stage count or automatic stage discovery.', 'stageCount: ', ['auto']),
    field('maxStages', 'Maximum CLOS stages', 'Upper bound for automatically inferred stages.', 'maxStages: '),
    field('stageKey', 'Stage field path', 'Object field path that explicitly supplies the CLOS stage.', 'stageKey: '),
    field('stageOrder', 'Stage order', 'Ordered stage names used by the CLOS layout.', 'stageOrder:\n      - '),
    field('inferLabelRole', 'Role-to-stage mapping', 'Optional role vocabulary used to infer CLOS stages.', 'inferLabelRole:\n      '),
    field('groupKey', 'Group field path', 'Object field path used to group nodes within a stage.', 'groupKey: '),
    field('preservePinned', 'Preserve pinned nodes', 'Keeps explicitly pinned nodes at their supplied positions.', 'preservePinned: ', ['true', 'false']),
    field('pinnedNodeIds', 'Pinned node IDs', 'Stable node IDs whose positions should remain fixed.', 'pinnedNodeIds:\n      - '),
    field('stageGap', 'Stage gap', 'Spacing in pixels between CLOS stages.', 'stageGap: '),
    field('nodeGap', 'Node gap', 'Spacing in pixels between nodes in one stage.', 'nodeGap: '),
    field('groupGap', 'Group gap', 'Additional spacing in pixels between groups.', 'groupGap: ')
  ],
  limits: [
    field('maxNodes', 'Maximum nodes', 'Maximum rendered node count.', 'maxNodes: '),
    field('maxEdges', 'Maximum edges', 'Maximum rendered edge count.', 'maxEdges: '),
    field('maxPathSegments', 'Maximum path segments', 'Maximum compiled path-segment count.', 'maxPathSegments: '),
    field('maxLabels', 'Maximum labels', 'Maximum rendered label count.', 'maxLabels: '),
    field('maxCallouts', 'Maximum callouts', 'Maximum rendered callout count.', 'maxCallouts: '),
    field('maxShapes', 'Maximum shapes', 'Maximum rendered diagram-shape count.', 'maxShapes: '),
    field('maxTexts', 'Maximum texts', 'Maximum rendered standalone-text count.', 'maxTexts: '),
    field('maxImageBytes', 'Maximum image bytes', 'Maximum accepted embedded-image payload size.', 'maxImageBytes: ')
  ]
};
