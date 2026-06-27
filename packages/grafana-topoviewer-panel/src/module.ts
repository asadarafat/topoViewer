import '@xyflow/react/dist/style.css';
import 'topoviewer/style.css';
import { PanelPlugin } from '@grafana/data';
import { TopoViewerPanel } from './TopoViewerPanel';
import { applyTopoViewerPanelOptions } from './panelOptions';
import type { TopoViewerGrafanaPanelOptions } from './types';

export const plugin = new PanelPlugin<TopoViewerGrafanaPanelOptions>(TopoViewerPanel).setPanelOptions((builder) => {
  applyTopoViewerPanelOptions(builder);
});
