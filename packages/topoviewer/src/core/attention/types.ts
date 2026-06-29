type Scalar = string | number | boolean;
type AttentionDataBag = Record<string, unknown>;
type AttentionLabels = Record<string, Scalar>;

interface AttentionEntity {
  readonly id: string;
  readonly name?: string;
  readonly label?: string;
  readonly labels?: AttentionLabels;
  readonly data?: AttentionDataBag;
  readonly layers?: string[];
}

export interface AttentionGraphNode extends AttentionEntity {
  readonly parent?: string;
}

export interface AttentionGraphLink extends AttentionEntity {
  readonly source: string;
  readonly target: string;
  readonly parent?: string;
  readonly directions?: Partial<Record<'sourceToTarget' | 'targetToSource', AttentionGraphLinkDirectionInput>>;
}

export interface AttentionGraphLinkDirectionInput {
  readonly id?: string;
  readonly name?: string;
  readonly label?: string;
  readonly labels?: AttentionLabels;
  readonly data?: AttentionDataBag;
}

export interface AttentionGraphLinkDirection extends AttentionEntity {
  readonly direction: 'sourceToTarget' | 'targetToSource';
  readonly linkId: string;
  readonly parentLinkId: string;
  readonly source: string;
  readonly target: string;
}

export interface AttentionGraphPath extends AttentionEntity {
  readonly sequence?: string[];
  readonly source?: string;
  readonly target?: string;
  readonly parent?: string;
}

export interface AttentionGraphRegion extends AttentionEntity {
  readonly members?: string[];
  readonly parent?: string;
}

export interface AttentionGraphDefinition {
  readonly nodes?: AttentionGraphNode[];
  readonly links?: AttentionGraphLink[];
  readonly paths?: AttentionGraphPath[];
  readonly regions?: AttentionGraphRegion[];
}

export interface AttentionTopoDocument {
  readonly graph?: AttentionGraphDefinition;
}

export type AttentionObjectKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region';

export type AttentionGraphInput = AttentionTopoDocument | AttentionGraphDefinition;

export interface AttentionObjectByKind {
  node: AttentionGraphNode;
  link: AttentionGraphLink;
  linkDirection: AttentionGraphLinkDirection;
  path: AttentionGraphPath;
  region: AttentionGraphRegion;
}

export interface AttentionIndexedObject<K extends AttentionObjectKind = AttentionObjectKind> {
  readonly id: string;
  readonly kind: K;
  readonly entity: Readonly<AttentionObjectByKind[K]>;
}

export interface AttentionGraphIndex {
  readonly objectIds: readonly string[];
  readonly nodeIds: readonly string[];
  readonly linkIds: readonly string[];
  readonly linkDirectionIds: readonly string[];
  readonly pathIds: readonly string[];
  readonly regionIds: readonly string[];

  getObject(id: string): AttentionIndexedObject | undefined;
  getObject<K extends AttentionObjectKind>(id: string, kind: K): AttentionIndexedObject<K> | undefined;
  getNode(id: string): AttentionIndexedObject<'node'> | undefined;
  getLink(id: string): AttentionIndexedObject<'link'> | undefined;
  getLinkDirection(id: string): AttentionIndexedObject<'linkDirection'> | undefined;
  getPath(id: string): AttentionIndexedObject<'path'> | undefined;
  getRegion(id: string): AttentionIndexedObject<'region'> | undefined;

  getByLabel(key: string, value?: Scalar): readonly string[];
  getByData(path: string, value?: unknown): readonly string[];

  getParent(id: string): string | undefined;
  getChildren(parentId: string): readonly string[];

  getRegionMembers(regionId: string): readonly string[];
  getRegionsByMember(id: string): readonly string[];

  getPathMembers(pathId: string): readonly string[];
  getPathsByMember(id: string): readonly string[];

  getOutgoing(id: string): readonly string[];
  getIncoming(id: string): readonly string[];
  getAdjacent(id: string): readonly string[];
}

export type FocusDependencyDirection = 'upstream' | 'downstream' | 'both';
export type FocusPresentationMode = 'highlight' | 'dim-context' | 'hide-context';

export interface FocusDependencyQuery {
  readonly from: readonly string[];
  readonly direction: FocusDependencyDirection;
  readonly depth: number;
}

export interface FocusChangeQuery {
  readonly since?: string | number | Date;
  readonly timestampFields?: readonly string[];
  readonly revision?: string | number;
  readonly revisionFields?: readonly string[];
}

export interface FocusQuery {
  readonly ids?: readonly string[];
  readonly labels?: Readonly<Record<string, Scalar | readonly Scalar[]>>;
  readonly data?: Readonly<Record<string, unknown | readonly unknown[]>>;
  readonly pathIds?: readonly string[];
  readonly regionIds?: readonly string[];
  readonly selectors?: readonly string[];
  readonly dependency?: FocusDependencyQuery;
  readonly changes?: FocusChangeQuery;
  readonly mode?: FocusPresentationMode;
}

export interface FocusResult {
  readonly mode: FocusPresentationMode;
  readonly focusedIds: ReadonlySet<string>;
  readonly relatedIds: ReadonlySet<string>;
  readonly contextIds: ReadonlySet<string>;
  readonly hiddenIds: ReadonlySet<string>;
  readonly reasons: ReadonlyMap<string, readonly string[]>;
}

export type FocusQueryErrorCode = 'missing-id' | 'invalid-depth' | 'unsupported-mode';

export type AggregateGroupKind = 'region' | 'parent' | 'label';

export interface BaseAggregateGroupDefinition {
  readonly id: string;
  readonly label?: string;
}

export interface RegionAggregateGroupDefinition extends BaseAggregateGroupDefinition {
  readonly by: 'region';
  readonly regionId: string;
}

export interface ParentAggregateGroupDefinition extends BaseAggregateGroupDefinition {
  readonly by: 'parent';
  readonly parentId: string;
}

export interface LabelAggregateGroupDefinition extends BaseAggregateGroupDefinition {
  readonly by: 'label';
  readonly key: string;
  readonly value: Scalar;
}

export type AggregateGroupDefinition =
  | RegionAggregateGroupDefinition
  | ParentAggregateGroupDefinition
  | LabelAggregateGroupDefinition;

export interface AttentionViewportPolicy {
  readonly groupIds?: readonly string[];
  readonly collapseBelowZoom?: number;
  readonly expandAboveZoom?: number;
  readonly hysteresis?: number;
}

export type LinkGroupingKey = 'endpoints' | 'layer';

export interface LinkGroupingViewportPolicy {
  readonly groupBelowZoom?: number;
  readonly ungroupAboveZoom?: number;
  readonly hysteresis?: number;
}

export interface LinkGroupingOptions {
  readonly enabled?: boolean;
  readonly threshold?: number;
  readonly by?: readonly LinkGroupingKey[];
  readonly expandedGroupIds?: readonly string[];
  readonly expandOnClick?: boolean;
  readonly viewport?: LinkGroupingViewportPolicy;
}

export interface DeriveAggregateGraphOptions {
  readonly groups: readonly AggregateGroupDefinition[];
  readonly expandedGroupIds?: readonly string[];
  readonly linkGrouping?: LinkGroupingOptions;
}

export interface AggregateGroupSummary {
  readonly id: string;
  readonly aggregateNodeId: string;
  readonly by: AggregateGroupKind;
  readonly sourceId?: string;
  readonly memberIds: readonly string[];
  readonly childCount: number;
  readonly linkCount: number;
  readonly severitySummary: Readonly<Record<string, number>>;
}

export interface LinkAggregateGroupSummary {
  readonly id: string;
  readonly aggregateLinkId: string;
  readonly source: string;
  readonly target: string;
  readonly layers: readonly string[];
  readonly memberIds: readonly string[];
  readonly count: number;
}

export interface AggregateGraphResult<Document extends AttentionTopoDocument = AttentionTopoDocument> {
  readonly document: Document;
  readonly groups: readonly AggregateGroupSummary[];
  readonly linkGroups: readonly LinkAggregateGroupSummary[];
}

export type AttentionPresentationState = 'focused' | 'related' | 'context' | 'dimmed' | 'hidden' | 'aggregate' | 'suppressed';
export type AttentionLabelPriority = 'focused' | 'high' | 'medium' | 'low' | 'aggregate' | 'hidden';

export interface AttentionScore {
  readonly id: string;
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface AttentionScoreResult {
  readonly scores: ReadonlyMap<string, AttentionScore>;
  readonly ordered: readonly AttentionScore[];
}

export interface AttentionScoringOptions {
  readonly suppressBelowScore?: number;
  readonly severityWeights?: Readonly<Record<string, number>>;
}

export interface AttentionPresentation {
  readonly id: string;
  readonly state: AttentionPresentationState;
  readonly labelPriority: AttentionLabelPriority;
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface AttentionPresentationResult {
  readonly items: ReadonlyMap<string, AttentionPresentation>;
  readonly ordered: readonly AttentionPresentation[];
}
