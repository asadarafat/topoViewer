import { z } from 'zod';
import { GEOMETRY_SHAPES } from './types';
import type { TopoDocument } from './types';
import { migrateTopoDocument } from './migration';

const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);
const labelsSchema = z.record(scalarSchema);
const dataSchema = z.record(z.unknown());
const styleSchema = z.record(z.unknown()).superRefine((style, ctx) => {
  for (const key of Object.keys(style)) {
    if (key.includes('-')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Style key "${key}" is not supported; use camelCase style keys.`,
        path: [key]
      });
    }
  }
});

const positionSchema = z.union([
  z.tuple([z.number(), z.number()]),
  z.object({ x: z.number(), y: z.number() }).passthrough()
]);

const sizeSchema = z.union([
  z.tuple([z.number(), z.number()]),
  z.object({ width: z.number(), height: z.number() }).passthrough()
]);

const bodySchema = z.union([z.string(), z.array(z.string())]);

const pinSchema = z.object({
  id: z.string().min(1),
  position: positionSchema.optional(),
  x: z.number().optional(),
  y: z.number().optional()
}).passthrough();

const layoutSchema = z.object({
  mode: z.enum(['manual', 'force']).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  iterations: z.number().optional(),
  linkDistance: z.number().optional(),
  chargeStrength: z.number().optional(),
  collideRadius: z.number().optional(),
  centerStrength: z.number().optional()
}).passthrough();

const limitsSchema = z.object({
  maxNodes: z.number().int().positive().optional(),
  maxEdges: z.number().int().positive().optional(),
  maxPathSegments: z.number().int().positive().optional(),
  maxLabels: z.number().int().positive().optional(),
  maxCallouts: z.number().int().positive().optional(),
  maxShapes: z.number().int().positive().optional(),
  maxImageBytes: z.number().int().positive().optional()
}).passthrough();

const graphEntitySchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  label: z.string().optional(),
  labels: labelsSchema.optional(),
  data: dataSchema.optional(),
  layers: z.array(z.string().min(1)).optional(),
  style: styleSchema.optional(),
  icon: z.string().optional()
}).passthrough();

const nodeSchema = graphEntitySchema.extend({
  position: positionSchema.optional(),
  parent: z.string().optional(),
  pins: z.array(pinSchema).optional()
}).passthrough();

const linkSchema = graphEntitySchema.extend({
  source: z.string().min(1),
  target: z.string().min(1),
  parent: z.string().optional()
}).passthrough();

const pathSchema = graphEntitySchema.extend({
  sequence: z.array(z.string().min(1)).min(2).optional(),
  source: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  parent: z.string().optional()
}).passthrough().refine((value) => (
  (Array.isArray(value.sequence) && value.sequence.length >= 2)
  || (!!value.source && !!value.target && !!value.parent)
), {
  message: 'Path requires sequence, or source/target/parent when carried by another path',
  path: ['sequence']
});

const regionSchema = graphEntitySchema.extend({
  members: z.array(z.string().min(1)).optional(),
  parent: z.string().optional(),
  padding: z.number().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  headerPadding: z.number().optional(),
  nodeWidth: z.number().optional(),
  nodeHeight: z.number().optional(),
  minWidth: z.number().optional(),
  minHeight: z.number().optional(),
  parentPadding: z.number().optional(),
  parentPaddingX: z.number().optional(),
  parentPaddingY: z.number().optional()
}).passthrough();

const shapeSchema = graphEntitySchema.extend({
  type: z.enum(GEOMETRY_SHAPES).optional(),
  position: positionSchema.optional(),
  size: sizeSchema.optional(),
  rotation: z.number().optional(),
  locked: z.boolean().optional(),
  pins: z.array(pinSchema).optional()
}).passthrough();

const connectorSchema = graphEntitySchema.extend({
  source: z.string().optional(),
  target: z.string().optional(),
  sourcePin: z.string().optional(),
  targetPin: z.string().optional(),
  sourcePosition: positionSchema.optional(),
  targetPosition: positionSchema.optional()
}).passthrough().refine((value) => value.source || value.sourcePosition, {
  message: 'Connector requires source or sourcePosition',
  path: ['source']
}).refine((value) => value.target || value.targetPosition, {
  message: 'Connector requires target or targetPosition',
  path: ['target']
});

const calloutSchema = graphEntitySchema.extend({
  position: positionSchema.optional(),
  size: sizeSchema.optional(),
  title: z.string().optional(),
  body: bodySchema.optional(),
  markdown: bodySchema.optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  source: z.string().optional(),
  sourcePosition: positionSchema.optional(),
  target: z.string().optional(),
  targetPin: z.string().optional(),
  targetPosition: positionSchema.optional(),
  sourcePin: z.string().optional(),
  leader: styleSchema.optional(),
  locked: z.boolean().optional(),
  pins: z.array(pinSchema).optional()
}).passthrough();

const diagramSchema = z.object({
  shapes: z.array(shapeSchema).optional(),
  connectors: z.array(connectorSchema).optional(),
  callouts: z.array(calloutSchema).optional()
}).passthrough();

const graphSchema = z.object({
  id: z.string().optional(),
  layers: z.array(z.object({
    id: z.string().min(1),
    name: z.string().optional()
  }).passthrough()).optional(),
  nodes: z.array(nodeSchema).optional(),
  links: z.array(linkSchema).optional(),
  paths: z.array(pathSchema).optional(),
  regions: z.array(regionSchema).optional()
}).passthrough();

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
    name: z.string().optional(),
    default: z.boolean().optional()
  }).passthrough()).optional(),
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
  const result = topoDocumentSchema.safeParse(migrateTopoDocument(document));
  if (result.success) return result.data as TopoDocument;
  throw new Error(`${context} is invalid: ${validationMessage(result.error)}`);
}
