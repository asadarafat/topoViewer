import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
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
      slotProps={{ paper: { className: 'studio-quick-text-editor' } }}
    >
      {target ? (
        <form aria-label={`Edit ${target.label}`} onKeyDown={keyDown} onSubmit={submit} role="dialog">
          <strong>Edit {target.label}</strong>
          <StudioTextField
            autoFocus
            label={target.multiline ? 'Text' : 'Label'}
            maxRows={8}
            minRows={target.multiline ? 3 : undefined}
            multiline={target.multiline}
            onChange={(event) => setDraft(event.target.value)}
            value={draft}
          />
          <span className="studio-quick-text-hint">
            {target.multiline ? 'Enter saves. Shift+Enter adds a line.' : 'Enter saves the label.'}
          </span>
          <div className="studio-quick-text-actions">
            <StudioButton onClick={onCancel} type="button">Cancel</StudioButton>
            <StudioButton className="studio-primary-button" type="submit">Save</StudioButton>
          </div>
        </form>
      ) : null}
    </StudioPopover>
  );
}
