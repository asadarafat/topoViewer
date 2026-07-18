import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { mapperPresetOptions } from './mapperPresets';

interface MapperYamlToolsHost {
  openDocs(target: string): Promise<void>;
}

interface MapperYamlActionsProps {
  host: MapperYamlToolsHost;
  insertMapperPreset?: (presetId: string) => void;
}

export function MapperYamlActions({ host, insertMapperPreset }: MapperYamlActionsProps) {
  const [mapperDocsAnchor, setMapperDocsAnchor] = useState<HTMLElement | null>(null);
  const [mapperPresetAnchor, setMapperPresetAnchor] = useState<HTMLElement | null>(null);
  const closeMapperDocs = () => setMapperDocsAnchor(null);
  const closeMapperPresets = () => setMapperPresetAnchor(null);
  const openMapperDocs = (target: string) => {
    closeMapperDocs();
    void host.openDocs(target);
  };
  const applyMapperPreset = (presetId: string) => {
    closeMapperPresets();
    insertMapperPreset?.(presetId);
  };

  return (
    <>
      <Button
        aria-controls={mapperDocsAnchor ? 'topoviewer-vscode-mapper-docs-menu' : undefined}
        aria-haspopup="menu"
        size="small"
        onClick={(event) => setMapperDocsAnchor(event.currentTarget)}
      >
        Mapper docs
      </Button>
      <Menu
        anchorEl={mapperDocsAnchor}
        id="topoviewer-vscode-mapper-docs-menu"
        onClose={closeMapperDocs}
        open={Boolean(mapperDocsAnchor)}
      >
        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/grafana-mapper-recipes/')}>Mapper recipes</MenuItem>
        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/schemas/#grafana-mapper-yaml')}>Mapper schema</MenuItem>
        <MenuItem onClick={() => openMapperDocs('docs/zensical/topoviewer/object-reference/')}>Object attributes</MenuItem>
      </Menu>
      <Button
        aria-controls={mapperPresetAnchor ? 'topoviewer-vscode-mapper-presets-menu' : undefined}
        aria-haspopup="menu"
        size="small"
        onClick={(event) => setMapperPresetAnchor(event.currentTarget)}
      >
        Presets
      </Button>
      <Menu
        anchorEl={mapperPresetAnchor}
        id="topoviewer-vscode-mapper-presets-menu"
        onClose={closeMapperPresets}
        open={Boolean(mapperPresetAnchor)}
      >
        {mapperPresetOptions.map((preset) => (
          <MenuItem key={preset.id} onClick={() => applyMapperPreset(preset.id)}>
            <Stack spacing={0.25}>
              <Typography variant="body2">{preset.label}</Typography>
              <Typography variant="caption" color="text.secondary">{preset.description}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
