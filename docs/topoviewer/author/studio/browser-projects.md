# Browser Projects

**Support status:** Experimental

The browser host stores projects and recovery snapshots in IndexedDB. It does
not write project content to `localStorage` and does not upload source to a
service.

Open **Project menu** to enter the **Projects** manager. Create, import, and
open-folder commands stay at the top. Each project row shows its last update
time and exposes rename, duplicate, export, and delete through its action menu.
The current project is marked explicitly, and project search appears when more
than one project exists. On narrow screens, primary commands stack at full
width while the project list remains unchanged.

## Saved And Recovery State

- `Saved` means the explicit project revision matches the current source.
- `Modified` means valid source differs from the saved revision.
- `Recovery` means Studio restored bounded autosave data after interruption.
- `Invalid Draft` means raw source is recoverable while the canvas uses the last
  valid projection.

A dirty stylesheet candidate is stored separately from the last valid applied
project. Restoring it does not mark invalid candidate text as saved source. Save
and export first apply a valid candidate; an invalid candidate must be corrected
or reverted.

Recovery does not replace explicit save. Export important work before clearing
browser site data.

## Move A Project

Choose **Export archive** from a project row's action menu to write a
deterministic `.tvstudio` archive containing source, metadata, and local assets.
**Open archive** validates all entries before creating a project. Duplicate
project IDs receive a new browser ID.

Browsers with the File System Access API may expose **Open folder**. Studio asks
for explicit read/write permission and keeps access inside the selected
directory. Archive import remains the portable fallback.

Quota, corrupt-record, interrupted-save, and migration failures are contained.
Studio preserves dirty source, offers retry or explicit reset, and does not
blank the current canvas.
