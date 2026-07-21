import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import TitleOutlinedIcon from '@mui/icons-material/TitleOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { safeMarkdownToHtml } from 'topoviewer';
import type { StudioQuickEditTarget } from './quickEditTarget';
import { StudioButton, StudioIconButton, StudioPopover, StudioTab, StudioTabs, StudioTextField } from '../../ui/controls';
import { prefixRichTextLines, wrapRichTextSelection, type RichTextEditResult } from './richTextEditing';
import { studioSpace } from '../../ui/muiSpacing';

export interface QuickTextEditorState extends StudioQuickEditTarget {
  x: number;
  y: number;
}

export function QuickTextEditor({ onCancel, onSave, target }: { onCancel(): void; onSave(value: string): void; target?: QuickTextEditorState }) {
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(target?.value || '');
    setMode('edit');
  }, [target]);

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
    if (event.key === 'Enter' && (!target?.richText || event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSave(draft);
    }
  }

  function applyEdit(edit: RichTextEditResult) {
    setDraft(edit.text);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  }

  function selection() {
    const input = inputRef.current;
    return {
      end: input?.selectionEnd ?? draft.length,
      start: input?.selectionStart ?? draft.length
    };
  }

  function wrap(prefix: string, suffix: string, placeholder: string) {
    const current = selection();
    applyEdit(wrapRichTextSelection(draft, current.start, current.end, prefix, suffix, placeholder));
  }

  function prefixLines(prefix: string) {
    const current = selection();
    applyEdit(prefixRichTextLines(draft, current.start, current.end, prefix));
  }

  const keepSelection = (event: MouseEvent) => event.preventDefault();

  return (
    <StudioPopover
      anchorPosition={target ? { left: target.x, top: target.y } : undefined}
      anchorReference="anchorPosition"
      onClose={onCancel}
      open={Boolean(target)}
      slotProps={{
        paper: {
          'aria-label': target ? `Edit ${target.label}` : undefined,
          role: 'dialog',
          sx: {
            p: studioSpace.space16,
            width: 'min(540px, calc(100vw - 24px))'
          }
        }
      }}
    >
      {target ? (
        <Box component="form" onKeyDown={keyDown} onSubmit={submit} sx={{ display: 'grid', gap: studioSpace.space10 }}>
          <Typography component="strong" variant="subtitle2">
            Edit {target.label}
          </Typography>
          {target.richText ? (
            <>
              <Stack
                aria-label="Rich text formatting"
                direction="row"
                role="toolbar"
                sx={{
                  alignItems: 'center',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  gap: studioSpace.space2,
                  minHeight: 40,
                  overflowX: 'auto',
                  p: studioSpace.space4
                }}
              >
                <StudioIconButton aria-label="Bold" onClick={() => wrap('**', '**', 'bold text')} onMouseDown={keepSelection} title="Bold" type="button">
                  <FormatBoldIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Italic" onClick={() => wrap('*', '*', 'italic text')} onMouseDown={keepSelection} title="Italic" type="button">
                  <FormatItalicIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Underline" onClick={() => wrap('++', '++', 'underlined text')} onMouseDown={keepSelection} title="Underline" type="button">
                  <FormatUnderlinedIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Strikethrough" onClick={() => wrap('~~', '~~', 'strikethrough text')} onMouseDown={keepSelection} title="Strikethrough" type="button">
                  <FormatStrikethroughIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Inline code" onClick={() => wrap('`', '`', 'code')} onMouseDown={keepSelection} title="Inline code" type="button">
                  <CodeOutlinedIcon fontSize="small" />
                </StudioIconButton>
                <Divider flexItem orientation="vertical" />
                <StudioIconButton aria-label="Heading" onClick={() => prefixLines('## ')} onMouseDown={keepSelection} title="Heading" type="button">
                  <TitleOutlinedIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Bulleted list" onClick={() => prefixLines('- ')} onMouseDown={keepSelection} title="Bulleted list" type="button">
                  <FormatListBulletedIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Numbered list" onClick={() => prefixLines('1. ')} onMouseDown={keepSelection} title="Numbered list" type="button">
                  <FormatListNumberedIcon fontSize="small" />
                </StudioIconButton>
                <StudioIconButton aria-label="Link" onClick={() => wrap('[', '](https://)', 'link text')} onMouseDown={keepSelection} title="Link" type="button">
                  <LinkOutlinedIcon fontSize="small" />
                </StudioIconButton>
              </Stack>
              <StudioTabs aria-label="Rich text editor mode" onChange={(_event, value: 'edit' | 'preview') => setMode(value)} value={mode} variant="fullWidth">
                <StudioTab label="Edit" value="edit" />
                <StudioTab label="Preview" value="preview" />
              </StudioTabs>
              {mode === 'edit' ? (
                <StudioTextField autoFocus inputRef={inputRef} label="Text" maxRows={14} minRows={7} multiline onChange={(event) => setDraft(event.target.value)} value={draft} />
              ) : (
                <Box
                  aria-label="Rich text preview"
                  dangerouslySetInnerHTML={{
                    __html: safeMarkdownToHtml(draft)
                  }}
                  role="document"
                  sx={{
                    bgcolor: 'background.default',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    maxHeight: 'min(360px, 45vh)',
                    minHeight: 184,
                    overflow: 'auto',
                    p: studioSpace.space12,
                    '& > :first-of-type': { mt: 0 },
                    '& > :last-of-type': { mb: 0 }
                  }}
                />
              )}
            </>
          ) : (
            <StudioTextField autoFocus label={target.multiline ? 'Text' : 'Label'} maxRows={8} minRows={target.multiline ? 3 : undefined} multiline={target.multiline} onChange={(event) => setDraft(event.target.value)} value={draft} />
          )}
          <Typography color="text.secondary" variant="caption">
            {target.richText ? 'Use Save to apply formatted text.' : target.multiline ? 'Enter saves. Shift+Enter adds a line.' : 'Enter saves the label.'}
          </Typography>
          <Stack direction="row" spacing={studioSpace.space8} sx={{ justifyContent: 'flex-end' }}>
            <StudioButton onClick={onCancel} type="button">
              Cancel
            </StudioButton>
            <StudioButton type="submit" variant="contained">
              Save
            </StudioButton>
          </Stack>
        </Box>
      ) : null}
    </StudioPopover>
  );
}
