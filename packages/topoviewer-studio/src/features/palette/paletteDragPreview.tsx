import type { Ref } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { studioSpace } from '../../ui/muiSpacing';

interface PaletteDragPreviewOptions {
  dataTransfer: DataTransfer;
  label: string;
  preview: HTMLDivElement | null;
  source: HTMLElement;
}

export function createPaletteDragPreview({ dataTransfer, label, preview, source }: PaletteDragPreviewOptions) {
  const sourcePreview = source.querySelector<HTMLElement>('.studio-template-preview');
  const visualHost = preview?.querySelector<HTMLElement>('.studio-palette-drag-preview-visual');
  const labelHost = preview?.querySelector<HTMLElement>('.studio-palette-drag-preview-label');
  if (!preview || !sourcePreview || !visualHost || !labelHost || typeof dataTransfer.setDragImage !== 'function') return () => undefined;

  const visual = sourcePreview.cloneNode(true) as HTMLElement;
  visual.removeAttribute('aria-hidden');
  visualHost.replaceChildren(visual);
  labelHost.textContent = label;
  preview.dataset.testid = 'studio-palette-drag-preview';

  const bounds = preview.getBoundingClientRect();
  try {
    dataTransfer.setDragImage(preview, Math.min(24, bounds.width / 2), bounds.height / 2);
  } catch {
    visualHost.replaceChildren();
    delete preview.dataset.testid;
    return () => undefined;
  }

  return () => {
    visualHost.replaceChildren();
    labelHost.textContent = '';
    delete preview.dataset.testid;
  };
}

export function PaletteDragPreview({ previewRef }: { previewRef: Ref<HTMLDivElement> }) {
  return (
    <Paper
      aria-hidden="true"
      elevation={4}
      ref={previewRef}
      sx={{
        alignItems: 'center',
        border: 1,
        borderColor: 'primary.main',
        borderRadius: 1,
        boxSizing: 'border-box',
        display: 'grid',
        gap: studioSpace.space8,
        gridTemplateColumns: '64px minmax(0, auto)',
        left: -1000,
        maxWidth: 180,
        minHeight: 48,
        pointerEvents: 'none',
        position: 'fixed',
        px: studioSpace.space10,
        py: studioSpace.space6,
        top: -1000,
        width: 'max-content',
        zIndex: -1
      }}
    >
      <Box className="studio-palette-drag-preview-visual" />
      <Typography className="studio-palette-drag-preview-label" noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }} variant="subtitle2" />
    </Paper>
  );
}
