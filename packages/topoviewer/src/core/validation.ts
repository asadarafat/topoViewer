import { z } from 'zod';
import { LINK_DIRECTION_KEYS } from './types';
import { finiteNumber } from './edgeStyle';
import { parseNodeShapePoints } from './nodeShapes';
import { canonicalStyleKeyByLowercase } from './styleDefaults';
import type { TopoDocument } from './types';
import { TOPOLOGY_OBJECT_PRESENTATION_FIELDS } from './topologyOwnership';

const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);
const labelsSchema = z.record(scalarSchema);
const dataSchema = z.record(z.unknown());

function forbidObjectKeys<T extends z.ZodTypeAny>(schema: T, keys: readonly string[]): z.ZodEffects<T> {
  return schema.superRefine((value, ctx) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    keys.forEach((key) => {
      if (!(key in value)) return;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} is not allowed in canonical topology objects. Put display aliases in labels.name and visual policy in stylesheet YAML.`,
        path: [key]
      });
    });
  });
}
const nodeLayoutSchema = z.object({
  type: z.enum(['standard', 'card']),
  direction: z.enum(['horizontal']).optional(),
  icon: z.object({
    placement: z.enum(['left']).optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional()
  }).passthrough().optional(),
  content: z.object({
    align: z.enum(['left', 'center', 'right']).optional(),
    titleField: z.string().min(1).optional(),
    subtitleField: z.string().min(1).optional()
  }).passthrough().optional()
}).passthrough();

const styleSchema = z.record(z.unknown()).superRefine((style, ctx) => {
  for (const key of Object.keys(style)) {
    if (key.includes('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Style key "${key}" is not supported; use camelCase style keys.`,
        path: [key]
      });
      continue;
    }

    const canonicalKey = canonicalStyleKeyByLowercase.get(key.toLowerCase());
    if (canonicalKey && canonicalKey !== key) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Style key "${key}" is not supported; use "${canonicalKey}".`,
        path: [key]
      });
    }

    if (
      (
        key === 'labelZIndex'
        || key === 'sourceLabelZIndex'
        || key === 'targetLabelZIndex'
      )
      && finiteNumber(style[key]) === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must be a finite number.`,
        path: [key]
      });
    }
  }
  const polygonPoints = parseNodeShapePoints(style.shapePolygonPoints);
  if (polygonPoints.error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: polygonPoints.error,
      path: ['shapePolygonPoints']
    });
  }
  if (style.nodeLayout !== undefined) {
    const nodeLayout = nodeLayoutSchema.safeParse(style.nodeLayout);
    if (!nodeLayout.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `nodeLayout is invalid: ${nodeLayout.error.issues.map((entry) => `${formatPath(entry.path)}: ${entry.message}`).join('; ')}`,
        path: ['nodeLayout']
      });
    }
  }
});

const positionSchema = z.union([
  z.tuple([z.number(), z.number()]),
  z.object({ x: z.number(), y: z.number() }).passthrough()
]);

const inferLabelRoleSchema = z.union([
  z.record(z.union([z.string(), z.array(z.string())])),
  z.array(z.record(z.union([z.string(), z.array(z.string())])))
]);

const bodySchema = z.union([z.string(), z.array(z.string())]);

const pinSchema = z.object({
  id: z.string().min(1),
  position: positionSchema.optional(),
  x: z.number().optional(),
  y: z.number().optional()
}).passthrough();

const nodeHandleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['source', 'target', 'both']).optional(),
  position: z.enum(['left', 'right', 'top', 'bottom']).optional(),
  side: z.enum(['left', 'right', 'top', 'bottom']).optional(),
  offset: z.number().optional()
}).passthrough();

const closLayoutSchema = z.object({
  direction: z.enum(['topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft']).optional(),
  stageCount: z.union([z.number().int().positive(), z.literal('auto')]).optional(),
  maxStages: z.number().int().positive().optional(),
  stageKey: z.string().optional(),
  stageOrder: z.array(z.string().min(1)).optional(),
  inferLabelRole: inferLabelRoleSchema.optional(),
  groupKey: z.string().optional(),
  preservePinned: z.boolean().optional(),
  pinnedNodeIds: z.array(z.string().min(1)).optional(),
  stageGap: z.number().optional(),
  nodeGap: z.number().optional(),
  groupGap: z.number().optional()
}).passthrough();

const layoutSchema = z.object({
  mode: z.enum(['manual', 'force', 'clos']).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  iterations: z.number().optional(),
  linkDistance: z.number().optional(),
  chargeStrength: z.number().optional(),
  collideRadius: z.number().optional(),
  centerStrength: z.number().optional(),
  inferLabelRole: inferLabelRoleSchema.optional(),
  clos: closLayoutSchema.optional()
}).passthrough();

const limitsSchema = z.object({
  maxNodes: z.number().int().positive().optional(),
  maxEdges: z.number().int().positive().optional(),
  maxPathSegments: z.number().int().positive().optional(),
  maxLabels: z.number().int().positive().optional(),
  maxCallouts: z.number().int().positive().optional(),
  maxShapes: z.number().int().positive().optional(),
  maxTexts: z.number().int().positive().optional(),
  maxImageBytes: z.number().int().positive().optional()
}).passthrough();

const graphEntitySchema = z.object({
  id: z.string().min(1),
  labels: labelsSchema.optional(),
  data: dataSchema.optional(),
  layers: z.array(z.string().min(1)).optional()
}).passthrough();

function canonicalEntitySchema<T extends z.ZodRawShape>(shape: T = {} as T, forbidden: readonly string[] = []) {
  return forbidObjectKeys(graphEntitySchema.extend(shape).passthrough(), ['name', 'label', 'style', 'icon', ...forbidden]);
}

const linkDirectionSchema = forbidObjectKeys(z.object({
  id: z.string().min(1).optional(),
  label: z.string().optional(),
  labels: labelsSchema.optional(),
  data: dataSchema.optional()
}).passthrough(), ['name', 'style', 'icon']);

const linkDirectionsSchema = z.object(Object.fromEntries(
  LINK_DIRECTION_KEYS.map((key) => [key, linkDirectionSchema.optional()])
)).passthrough();

const nodeSchema = canonicalEntitySchema({
  position: positionSchema.optional(),
  parent: z.string().optional(),
  pins: z.array(pinSchema).optional(),
  handles: z.array(nodeHandleSchema).optional()
});

const linkSchema = canonicalEntitySchema({
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().min(1).optional(),
  targetHandle: z.string().min(1).optional(),
  sourceLabel: z.string().min(1).optional(),
  targetLabel: z.string().min(1).optional(),
  parent: z.string().optional(),
  directions: linkDirectionsSchema.optional()
});

const pathSchema = canonicalEntitySchema({
  sequence: z.array(z.string().min(1)).min(2).optional(),
  source: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  parent: z.string().optional()
}).refine((value) => (
  (Array.isArray(value.sequence) && value.sequence.length >= 2)
  || (!!value.source && !!value.target && !!value.parent)
), {
  message: 'Path requires sequence, or source/target/parent when carried by another path',
  path: ['sequence']
});

const regionSchema = canonicalEntitySchema({
  members: z.array(z.string().min(1)).optional(),
  parent: z.string().optional(),
  position: positionSchema.optional()
}, TOPOLOGY_OBJECT_PRESENTATION_FIELDS.region);

const shapeSchema = canonicalEntitySchema({
  position: positionSchema.optional(),
  locked: z.boolean().optional(),
  pins: z.array(pinSchema).optional()
}, TOPOLOGY_OBJECT_PRESENTATION_FIELDS.shape);

const connectorSchema = canonicalEntitySchema({
  source: z.string().optional(),
  target: z.string().optional(),
  sourcePin: z.string().optional(),
  targetPin: z.string().optional(),
  sourcePosition: positionSchema.optional(),
  targetPosition: positionSchema.optional()
}).refine((value) => value.source || value.sourcePosition, {
  message: 'Connector requires source or sourcePosition',
  path: ['source']
}).refine((value) => value.target || value.targetPosition, {
  message: 'Connector requires target or targetPosition',
  path: ['target']
});

const calloutSchema = forbidObjectKeys(graphEntitySchema.extend({
  position: positionSchema.optional(),
  title: z.string().optional(),
  body: bodySchema.optional(),
  markdown: bodySchema.optional(),
  source: z.string().optional(),
  sourcePosition: positionSchema.optional(),
  target: z.string().optional(),
  targetPin: z.string().optional(),
  targetPosition: positionSchema.optional(),
  sourcePin: z.string().optional(),
  locked: z.boolean().optional(),
  pins: z.array(pinSchema).optional()
}).passthrough(), ['name', 'label', 'style', 'icon', 'leader', ...TOPOLOGY_OBJECT_PRESENTATION_FIELDS.callout]);

const textSchema = canonicalEntitySchema({
  text: z.string().optional(),
  position: positionSchema.optional(),
  locked: z.boolean().optional()
}, TOPOLOGY_OBJECT_PRESENTATION_FIELDS.text);

const diagramSchema = z.object({
  shapes: z.array(shapeSchema).optional(),
  connectors: z.array(connectorSchema).optional(),
  callouts: z.array(calloutSchema).optional(),
  texts: z.array(textSchema).optional()
}).passthrough();

const graphSchema = forbidObjectKeys(z.object({
  id: z.string().optional(),
  labels: labelsSchema.optional(),
  data: dataSchema.optional(),
  layers: z.array(z.object({
    id: z.string().min(1),
    labels: labelsSchema.optional()
  }).passthrough().superRefine((value, ctx) => {
    if ('name' in value) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'name is not allowed; use labels.name.', path: ['name'] });
  })).optional(),
  nodes: z.array(nodeSchema).optional(),
  links: z.array(linkSchema).optional(),
  paths: z.array(pathSchema).optional(),
  regions: z.array(regionSchema).optional()
}).passthrough(), ['name', 'label', 'style', 'icon']);

const iconSchema = z.object({
  glyph: z.string().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  svg: z.string().optional(),
  src: z.string().optional(),
  alt: z.string().optional()
}).passthrough();

const styleRuleSchema = z.object({
  selector: z.string().min(1),
  style: styleSchema.optional()
}).passthrough();

export const topoDocumentSchema: z.ZodType<TopoDocument> = z.object({
  version: z.string().optional(),
  graph: graphSchema.optional(),
  diagram: diagramSchema.optional(),
  toggles: z.array(z.object({
    id: z.string().min(1),
    labels: labelsSchema.optional(),
    default: z.boolean().optional()
  }).passthrough().superRefine((value, ctx) => {
    if ('name' in value) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'name is not allowed; use labels.name.', path: ['name'] });
  })).optional(),
  layout: layoutSchema.optional(),
  limits: limitsSchema.optional(),
  icons: z.record(iconSchema).optional(),
  labelFields: z.array(z.string().min(1)).optional(),
  stylesheet: z.array(styleRuleSchema).optional()
}).passthrough() as z.ZodType<TopoDocument>;

function formatPath(path: Array<string | number>): string {
  return path.length ? path.join('.') : '<root>';
}

function validationMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${formatPath(issue.path)}: ${issue.message}`)
    .join('; ');
}

export function validateTopoDocument(document: unknown, context = 'TopoViewer document'): TopoDocument {
  const result = topoDocumentSchema.safeParse(document);
  if (result.success) return result.data as TopoDocument;
  throw new Error(`${context} is invalid: ${validationMessage(result.error)}`);
}
