# YAML Recovery

**Support status:** Beta Preview

Use **Properties > Code** to edit `topology.yaml` and `stylesheet.yaml`. Use
**Mapper > Code** for the optional `mapper.yaml` after the first mapper rule
creates the file. The owned Code views share Monaco registration, diagnostics,
focus behavior, and disposal; Monaco remains lazy until source editing begins.

## Apply A Source Edit

1. Open the owning Code view and select the document when applicable.
2. Edit the YAML.
3. Review inline diagnostics.
4. Choose **Apply**.

A valid topology or mapper draft becomes the current project and one undo
transaction. `stylesheet.yaml` first becomes the shared stylesheet candidate;
choose **Apply** in the Properties footer to commit it. Selection and source ranges
remain correlated, so a canvas object can open its YAML and a source cursor can
select the corresponding canvas object or mapper rule.

## Recover An Invalid Draft

Invalid source never replaces the last valid canvas projection. Studio reports
the diagnostics, keeps the raw draft available, and continues rendering the
last valid graph or stylesheet candidate.

Use diagnostics to navigate to the failing range. For stylesheet changes, choose **Revert**
to restore the applied stylesheet. Reloading a browser project preserves the
recoverable candidate separately from the last valid applied project instead of
promoting broken source silently.

Structured scalar edits preserve untouched comments, ordering, quoting, line
endings, aliases, and unknown keys. A collection edit that requires
normalization opens a focused review dialog with the diff and reason before
replacing source text.

If the optional editor fails to load, Studio keeps the canvas and Visual styling
usable and exposes a raw-source recovery action. The project is not discarded
because an editor module is unavailable.
