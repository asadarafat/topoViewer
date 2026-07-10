# YAML Recovery

**Support status:** Experimental

Open **Workspace drawer** to edit `topology.yaml`, `stylesheet.yaml`, or the
optional `mapper.yaml`. Monaco loads only when the drawer opens, and each source
document keeps an isolated editor model.

## Apply A Source Edit

1. Select the document tab.
2. Edit the YAML.
3. Review diagnostics and the source diff.
4. Choose **Apply**.

A valid draft becomes the current project and one undo transaction. Selection
and source ranges remain correlated, so a canvas object can open its YAML and a
source cursor can select the corresponding canvas object.

## Recover An Invalid Draft

Invalid source never replaces the last valid canvas projection. Studio reports
`Invalid Draft`, keeps the raw draft available, and continues rendering the last
valid graph.

Use diagnostics to navigate to the failing range. Choose **Revert invalid
draft** to restore the last valid source. Reloading a browser project preserves
the recoverable invalid draft and the valid projection instead of promoting
broken source silently.

Structured scalar edits preserve untouched comments, ordering, quoting, line
endings, aliases, and unknown keys. A collection edit that requires
normalization must show the diff and reason before replacing source text.

If the optional editor fails to load, Studio keeps the canvas and a raw source
recovery path usable. The project is not discarded because an editor module is
unavailable.
