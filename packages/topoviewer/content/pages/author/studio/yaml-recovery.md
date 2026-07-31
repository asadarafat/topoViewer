# YAML Recovery

**Support status:** Beta Preview

Select `topology.yaml`, `stylesheet.yaml`, or the optional `mapper.yaml` in
project source. One shared Monaco workspace owns registration, diagnostics,
focus behavior, and disposal; Monaco remains lazy until source is shown.

## Apply A Source Edit

1. Select the owning document in project source.
2. Edit the YAML.
3. Review inline diagnostics.
4. Choose **Apply**.

A valid topology or mapper draft becomes the current project and one undo
transaction. `stylesheet.yaml` first becomes the shared stylesheet candidate;
choose **Apply** in the source footer to commit it. Selection and source ranges
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

If the optional editor fails to load, Studio keeps preview and visual
Properties usable and exposes a raw-source recovery action. The project is not
discarded because an editor module is unavailable.
