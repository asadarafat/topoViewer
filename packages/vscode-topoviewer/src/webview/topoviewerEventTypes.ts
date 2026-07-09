import type { TopoViewerProps } from 'topoviewer';

export type TopoViewerNodeResizeChange = Parameters<NonNullable<TopoViewerProps['onNodeResizeChange']>>[0];
export type TopoViewerRegionAggregateToggle = Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0];
