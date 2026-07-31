# Troubleshooting

**Support status:** Beta Preview

## The Canvas Is Blank

Select the applicable topology, stylesheet, or mapper document in project
source and inspect diagnostics in the shared source workspace. Invalid source
keeps the last valid projection, while a renderer error shows a contained
recovery screen.
Confirm the selected layer contains visible objects and that node positions are
inside the configured manual layout.

When developing locally, restart `npm run studio:dev` after rebuilding core
package changes. A server that was already running may still serve an older
dependency build.

## A Link Or Path Was Not Created

A link needs valid source and target nodes. Studio rejects self-links and
unsupported endpoints before source mutation. Repeating a valid connection
creates a parallel link with its own stable ID and rendered lane. Connecting a
callout to a node creates a callout leader rather than a graph link.
A path requires graph reachability through existing links; create the missing
links or select a reachable traversal first.

## A Region Does Not Capture A Node

Move the node far enough inside the region to trigger containment preview, then
release it. Sibling region overlap is not interpreted as nesting. Use the
explicit group action for nested regions and the context menu to release a
member.

## YAML Shows Invalid Draft

Use diagnostics to open the failing source range. Fix and apply the draft, or
choose **Revert invalid draft**. The visible graph remains the last valid
projection until source validates.

## Browser Save Failed

Quota and persistence errors keep source in memory and offer retry. Export a
`.tvstudio` archive before resetting browser storage. Clearing site data removes
browser projects and recovery snapshots.

## Mapper Coverage Is Empty

Confirm mapper YAML is enabled, the metric name matches the sample, and the join
field exists on the target object. Review unresolved and ambiguous findings;
Studio does not guess between multiple valid identities.

## Desktop Studio Reports An External Conflict

Inspect the diff before choosing a source. **Keep Studio** preserves the current
dirty project. **Reload disk** replaces it with project-directory files. If the
directory was moved, deleted, or replaced by a symlink, reopen an approved
project directory instead of bypassing the native confinement error.

## Desktop Studio Reports A Partial Save

Stop editing the affected project directory and keep Studio open. Studio remains
dirty when a coordinated save fails. If the error says a recovery backup was
retained, preserve the `.topoviewer-backup-*` file in that directory before
retrying or repairing files manually. A successful rollback removes transaction
files automatically; a retained backup means the filesystem also prevented
Studio from restoring prior content and needs operator review.
