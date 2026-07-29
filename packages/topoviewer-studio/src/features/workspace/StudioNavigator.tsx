import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import SensorsOutlinedIcon from '@mui/icons-material/SensorsOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { ReactElement } from 'react';
import type { StudioDocumentKind, StudioSessionSnapshot } from '../../contracts/project';
import { LayerControls } from '../layers/LayerControls';
import { StudioListItemButton } from '../../ui/controls';
import { StudioPanelHeader } from '../../ui/StudioPanel';
import { studioLayoutSpacing, studioSpace } from '../../ui/muiSpacing';

export interface StudioNavigatorLayerActions {
  createLayer(name?: string): boolean;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  renameLayer(layerId: string, name: string): boolean;
  reorderLayer(layerId: string, targetIndex: number): boolean;
  setLayerMembership(layerId: string, assigned: boolean): boolean;
}

interface StudioNavigatorProps {
  hiddenLayerIds: string[];
  layerActions: StudioNavigatorLayerActions;
  onCollapse?(): void;
  onOpenDocument(kind: StudioDocumentKind): void;
  setHiddenLayerIds(layerIds: string[]): void;
  snapshot: StudioSessionSnapshot;
}

const documentIcons: Record<StudioDocumentKind, ReactElement> = {
  mapper: <SensorsOutlinedIcon fontSize="small" />,
  stylesheet: <PaletteOutlinedIcon fontSize="small" />,
  topology: <DataObjectOutlinedIcon fontSize="small" />
};

function documentFileName(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) || path;
}

export function StudioNavigator({ hiddenLayerIds, layerActions, onCollapse, onOpenDocument, setHiddenLayerIds, snapshot }: StudioNavigatorProps) {
  const documents = (['topology', 'stylesheet', 'mapper'] as const).filter((kind) => snapshot.project.documents[kind]);

  return (
    <Box
      aria-label="Project navigator"
      className="studio-navigator"
      component="nav"
      sx={{
        display: 'grid',
        gridTemplateRows: 'auto auto auto minmax(0, 1fr)',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <StudioPanelHeader onCollapse={onCollapse} title="Project" />
      <Box component="section" sx={{ px: studioLayoutSpacing.panelInline, py: studioSpace.space8 }}>
        <Typography color="text.secondary" component="h2" variant="overline">
          Files
        </Typography>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {documents.map((kind) => {
            const document = snapshot.project.documents[kind]!;
            const invalid = Boolean(snapshot.invalidDrafts[kind]);
            const fileName = documentFileName(document.path);
            return (
              <Box component="li" key={kind}>
                <StudioListItemButton onClick={() => onOpenDocument(kind)} sx={{ borderRadius: 1, minHeight: 28, px: studioSpace.space4, py: 0 }} title={document.path}>
                  <ListItemIcon sx={{ minWidth: 28 }}>{documentIcons[kind]}</ListItemIcon>
                  <ListItemText
                    primary={fileName}
                    slotProps={{ primary: { noWrap: true, variant: 'body2' } }}
                  />
                  {invalid ? (
                    <Typography aria-label={`${fileName} has an invalid draft`} color="error" component="span" variant="caption">
                      ●
                    </Typography>
                  ) : null}
                </StudioListItemButton>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Divider />
      <Box component="section" sx={{ minHeight: 0, overflowY: 'auto', px: studioLayoutSpacing.panelInline, py: studioSpace.space8 }}>
        <LayerControls
          createLayer={layerActions.createLayer}
          deleteLayer={layerActions.deleteLayer}
          hiddenLayerIds={hiddenLayerIds}
          renameLayer={layerActions.renameLayer}
          reorderLayer={layerActions.reorderLayer}
          setHiddenLayerIds={setHiddenLayerIds}
          setLayerMembership={layerActions.setLayerMembership}
          snapshot={snapshot}
        />
      </Box>
    </Box>
  );
}
