import { useMemo, useState, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { displayName } from 'topoviewer';
import type { StudioSelection, StudioSessionSnapshot } from '../contracts/project';
import type { StudioWorkspaceView } from '../features/workspace/WorkspaceRail';
import { StudioDialog, StudioListItemButton, StudioSearchField } from '../ui/controls';
import { studioSpace } from '../ui/muiSpacing';

interface StudioCommandPaletteProps {
  canRedo: boolean;
  canUndo: boolean;
  onClose(): void;
  onExport(): void;
  onOpenWorkspace(view: StudioWorkspaceView): void;
  onPresentation(): void;
  onRedo(): void;
  onReload(): void;
  onSelectObject(selection: StudioSelection): void;
  onUndo(): void;
  open: boolean;
  snapshot: StudioSessionSnapshot;
}

interface PaletteEntry {
  detail: string;
  id: string;
  label: string;
  run(): void;
}

const objectResultLimit = 10;

export function StudioCommandPalette({
  canRedo,
  canUndo,
  onClose,
  onExport,
  onOpenWorkspace,
  onPresentation,
  onRedo,
  onReload,
  onSelectObject,
  onUndo,
  open,
  snapshot
}: StudioCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const entries = useMemo<PaletteEntry[]>(() => {
    const commands: PaletteEntry[] = [
      { detail: 'Command', id: 'command:add', label: 'Open Add workspace', run: () => onOpenWorkspace('add') },
      { detail: 'Command', id: 'command:properties', label: 'Open Properties workspace', run: () => onOpenWorkspace('properties') },
      { detail: 'Command', id: 'command:project', label: 'Open Project workspace', run: () => onOpenWorkspace('project') },
      { detail: 'Command', id: 'command:mapper', label: 'Open Mapper workspace', run: () => onOpenWorkspace('mapper') },
      { detail: 'Command', id: 'command:export', label: 'Export project', run: onExport },
      ...(canUndo ? [{ detail: 'Command', id: 'command:undo', label: 'Undo', run: onUndo }] : []),
      ...(canRedo ? [{ detail: 'Command', id: 'command:redo', label: 'Redo', run: onRedo }] : []),
      { detail: 'Command', id: 'command:presentation', label: 'Enter presentation mode', run: onPresentation },
      { detail: 'Command', id: 'command:reload', label: 'Reload project', run: onReload }
    ];
    const graph = snapshot.projection.document.graph;
    const objects: PaletteEntry[] = [
      ...(graph?.nodes || []).map((node) => ({
        detail: 'Node',
        id: `node:${node.id}`,
        label: displayName(node),
        run: () => onSelectObject({ id: node.id, kind: 'node' as const })
      })),
      ...(graph?.links || []).map((link) => ({
        detail: `Link · ${link.source} → ${link.target}`,
        id: `link:${link.id}`,
        label: link.id,
        run: () => onSelectObject({ id: link.id, kind: 'link' as const })
      })),
      ...(graph?.regions || []).map((region) => ({
        detail: 'Region',
        id: `region:${region.id}`,
        label: displayName(region),
        run: () => onSelectObject({ id: region.id, kind: 'region' as const })
      })),
      ...(graph?.paths || []).map((path) => ({
        detail: 'Path',
        id: `path:${path.id}`,
        label: displayName(path),
        run: () => onSelectObject({ id: path.id, kind: 'path' as const })
      }))
    ];
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [...commands, ...objects.slice(0, objectResultLimit)];
    const matches = (entry: PaletteEntry) => `${entry.label} ${entry.detail}`.toLocaleLowerCase().includes(normalized);
    return [...commands.filter(matches), ...objects.filter(matches).slice(0, objectResultLimit)];
  }, [canRedo, canUndo, onExport, onOpenWorkspace, onPresentation, onRedo, onReload, onSelectObject, onUndo, query, snapshot.projection.document]);

  const boundedActiveIndex = Math.min(activeIndex, Math.max(0, entries.length - 1));

  function close() {
    setQuery('');
    setActiveIndex(0);
    onClose();
  }

  function run(entry: PaletteEntry) {
    close();
    entry.run();
  }

  function searchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, entries.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && entries[boundedActiveIndex]) {
      event.preventDefault();
      run(entries[boundedActiveIndex]);
    }
  }

  return (
    <StudioDialog
      aria-label="Search and commands"
      fullWidth
      maxWidth="sm"
      onClose={close}
      open={open}
      slotProps={{ paper: { sx: { alignSelf: 'flex-start', mt: 0 } } }}
    >
      <Box sx={{ p: studioSpace.space8 }}>
        <StudioSearchField
          aria-label="Search objects and commands"
          autoFocus
          clearLabel="Clear search"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onClear={() => setQuery('')}
          onKeyDown={searchKeyDown}
          placeholder="Search objects and commands"
          value={query}
        />
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, maxHeight: 360, overflowY: 'auto', p: studioSpace.space4 }}>
        {entries.map((entry, index) => (
          <Box component="li" key={entry.id}>
            <StudioListItemButton onClick={() => run(entry)} selected={index === boundedActiveIndex} sx={{ borderRadius: 1 }}>
              <ListItemText primary={entry.label} slotProps={{ primary: { noWrap: true, variant: 'body2' } }} />
              <Typography color="text.secondary" component="span" sx={{ flexShrink: 0 }} variant="caption">
                {entry.detail}
              </Typography>
            </StudioListItemButton>
          </Box>
        ))}
        {entries.length === 0 ? (
          <Typography color="text.secondary" component="li" sx={{ p: studioSpace.space8 }} variant="body2">
            No matches
          </Typography>
        ) : null}
      </Box>
    </StudioDialog>
  );
}
