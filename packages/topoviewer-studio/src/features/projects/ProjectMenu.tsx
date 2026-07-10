import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { StudioProjectSummary } from '../../contracts/host';
import type { StudioProject } from '../../contracts/project';
import { useDialogFocus } from '../../accessibility/focus';

export interface StudioProjectLifecycleActions {
  activeProjectId: string;
  error?: string;
  mode: 'browser' | 'workspace';
  projects: StudioProjectSummary[];
  create?: () => Promise<void>;
  delete?: () => Promise<void>;
  duplicate?: () => Promise<void>;
  exportArchive(project: StudioProject): Promise<void>;
  open?: (id: string) => Promise<void>;
  openArchive?: () => Promise<void>;
  openFolder?: () => Promise<void>;
  rename?: (name: string) => Promise<void>;
  resetStorage?: () => Promise<void>;
}

export function ProjectMenu({ actions, project }: { actions: StudioProjectLifecycleActions; project: StudioProject }) {
  const name = project.name;
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const menuDialog = useDialogFocus<HTMLElement>({
    active: open && !deleteOpen && !resetOpen,
    onDismiss: () => setOpen(false)
  });
  const deleteDialog = useDialogFocus<HTMLElement>({
    active: deleteOpen,
    onDismiss: () => setDeleteOpen(false)
  });
  const resetDialog = useDialogFocus<HTMLElement>({
    active: resetOpen,
    onDismiss: () => setResetOpen(false)
  });

  async function run(action: () => Promise<void>, close = true) {
    setBusy(true);
    try {
      await action();
      if (close) setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="studio-project-switcher">
      <button
        aria-expanded={open}
        aria-label="Project menu"
        className="studio-project-name"
        onClick={() => {
          setDraftName(name);
          setOpen((value) => !value);
        }}
        title={name}
        type="button"
      >
        <FolderOpenIcon fontSize="small" />
        <span>{name}</span>
      </button>
      {open ? (
        <section aria-label="Project menu" className="studio-project-menu" onKeyDown={menuDialog.onDialogKeyDown} ref={menuDialog.dialogRef} role="dialog" tabIndex={-1}>
          <header><strong>{actions.mode === 'workspace' ? 'VS Code bundle' : 'Browser projects'}</strong>{actions.mode === 'browser' ? <span>{actions.projects.length}</span> : null}</header>
          <div className="studio-project-actions">
            {actions.create ? <button disabled={busy} onClick={() => void run(actions.create!)} type="button"><AddIcon fontSize="small" />New</button> : null}
            {actions.openArchive ? <button disabled={busy} onClick={() => void run(actions.openArchive!)} type="button"><UploadFileIcon fontSize="small" />Open archive</button> : null}
            {actions.openFolder ? (
              <button disabled={busy} onClick={() => void run(actions.openFolder!)} type="button"><FolderOpenIcon fontSize="small" />Open folder</button>
            ) : null}
            <button disabled={busy} onClick={() => void run(() => actions.exportArchive(project))} type="button"><DownloadIcon fontSize="small" />Export archive</button>
            {actions.duplicate ? <button disabled={busy} onClick={() => void run(actions.duplicate!)} type="button"><ContentCopyIcon fontSize="small" />Duplicate</button> : null}
            {actions.rename ? <button disabled={busy} onClick={() => setRenaming(true)} type="button"><DriveFileRenameOutlineIcon fontSize="small" />Rename</button> : null}
            {actions.delete ? <button disabled={busy} onClick={() => setDeleteOpen(true)} type="button"><DeleteIcon fontSize="small" />Delete</button> : null}
          </div>
          {renaming ? (
            <form onSubmit={(event) => {
              event.preventDefault();
              if (!draftName.trim()) return;
              void run(() => actions.rename!(draftName), false).then(() => setRenaming(false));
            }}>
              <label>Project name<input autoFocus onChange={(event) => setDraftName(event.target.value)} value={draftName} /></label>
              <button disabled={!draftName.trim() || busy} type="submit">Apply</button>
              <button onClick={() => setRenaming(false)} type="button">Cancel</button>
            </form>
          ) : null}
          {actions.error ? (
            <div className="studio-project-error" role="alert">
              <p>{actions.error}</p>
              {actions.resetStorage ? <button onClick={() => setResetOpen(true)} type="button">Reset browser storage</button> : null}
            </div>
          ) : null}
          {actions.open ? <div className="studio-recent-projects" role="list" aria-label="Recent projects">
            {actions.projects.map((project) => (
              <div key={project.id} role="listitem">
                <button
                  aria-current={project.id === actions.activeProjectId ? 'true' : undefined}
                  disabled={busy || project.id === actions.activeProjectId}
                  onClick={() => void run(() => actions.open!(project.id))}
                  type="button"
                >
                  <strong>{project.name}</strong>
                  <span>{new Date(project.updatedAt).toLocaleString()}</span>
                </button>
              </div>
            ))}
          </div> : null}
        </section>
      ) : null}
      {deleteOpen ? (
        <section aria-label={`Delete ${name}?`} aria-modal="true" className="studio-confirm-dialog" onKeyDown={deleteDialog.onDialogKeyDown} ref={deleteDialog.dialogRef} role="alertdialog" tabIndex={-1}>
          <strong>Delete {name}?</strong>
          <p>The browser project and its recovery snapshots will be removed.</p>
          <div>
            <button onClick={() => setDeleteOpen(false)} type="button">Cancel</button>
            <button disabled={busy} onClick={() => void run(actions.delete!).then(() => setDeleteOpen(false))} type="button">Delete</button>
          </div>
        </section>
      ) : null}
      {resetOpen ? (
        <section aria-label="Reset browser storage?" aria-modal="true" className="studio-confirm-dialog" onKeyDown={resetDialog.onDialogKeyDown} ref={resetDialog.dialogRef} role="alertdialog" tabIndex={-1}>
          <strong>Reset browser storage?</strong>
          <p>All Studio browser projects and recovery snapshots will be removed. Export recoverable work first.</p>
          <div>
            <button onClick={() => setResetOpen(false)} type="button">Cancel</button>
            <button disabled={busy} onClick={() => void run(actions.resetStorage!).then(() => setResetOpen(false))} type="button">Reset</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
