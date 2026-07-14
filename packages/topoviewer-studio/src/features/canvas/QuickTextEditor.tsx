import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioQuickEditTarget } from '../../app/controllerAuthoring';
import { StudioButton, StudioPopover, StudioTextField } from '../../ui/controls';

export interface QuickTextEditorState extends StudioQuickEditTarget {
  x: number;
  y: number;
}

export function QuickTextEditor({
  onCancel,
  onSave,
  target
}: {
  onCancel(): void;
  onSave(value: string): void;
  target?: QuickTextEditorState;
}) {
  const [draft, setDraft] = useState('');

  useEffect(() => setDraft(target?.value || ''), [target]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(draft);
  }

  function keyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key === 'Enter' && (!target?.multiline || !event.shiftKey)) {
      event.preventDefault();
      onSave(draft);
    }
  }

  return (
    <StudioPopover
      anchorPosition={target ? { left: target.x, top: target.y } : undefined}
      anchorReference="anchorPosition"
      onClose={onCancel}
      open={Boolean(target)}
      slotProps={{ paper: { 'aria-label': target ? `Edit ${target.label}` : undefined, className: 'studio-quick-text-editor', role: 'dialog' } }}
    >
      {target ? (
        <Box component="form" onKeyDown={keyDown} onSubmit={submit}>
          <Typography component="strong" variant="subtitle2">Edit {target.label}</Typography>
          <StudioTextField
            autoFocus
            label={target.multiline ? 'Text' : 'Label'}
            maxRows={8}
            minRows={target.multiline ? 3 : undefined}
            multiline={target.multiline}
            onChange={(event) => setDraft(event.target.value)}
            value={draft}
          />
          <Typography className="studio-quick-text-hint" color="text.secondary" variant="caption">
            {target.multiline ? 'Enter saves. Shift+Enter adds a line.' : 'Enter saves the label.'}
          </Typography>
          <Stack className="studio-quick-text-actions" direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <StudioButton onClick={onCancel} type="button">Cancel</StudioButton>
            <StudioButton className="studio-primary-button" type="submit">Save</StudioButton>
          </Stack>
        </Box>
      ) : null}
    </StudioPopover>
  );
}
