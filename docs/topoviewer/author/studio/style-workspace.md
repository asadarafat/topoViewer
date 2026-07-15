# Style Workspace

**Support status:** Experimental

Studio offers two views of one candidate `stylesheet.yaml`: **Basic** for
selection-scoped visual changes and **YAML** for complete selector and source
control. Switching modes does not create a second draft, apply source, change
selection, or reset the viewport.

## Basic Styling

Select a node, link, link direction, path, region, shape, callout, or text
object, then open **Style**. Basic groups the commonly used attributes for that
object kind and provides typed Material controls generated from the core
authoring metadata:

- color wells paired with exact color text;
- switches for booleans;
- bounded number fields;
- enumerated selects;
- text and icon fields;
- structured editors for supported nested values.

A Basic commit creates or updates an exact-ID selector in the candidate
stylesheet. It does not add an inline `style` to `topology.yaml`:

```yaml
stylesheet:
  - selector: 'node[id = "core-1"]'
    style:
      backgroundColor: "#1565c0"
```

Reset removes that explicit candidate field so the object inherits from other
matching rules again. Selecting several objects of the same kind applies one
atomic update to their exact-ID rules. Mixed values are identified explicitly.
Mixed-kind selection remains YAML-only because those object kinds do not share
one safe field contract.

Search covers the Basic fields for the selected target. Group disclosure changes
only presentation; browsing, opening, or searching fields never mutates YAML.
Less-common and collection-oriented style contracts remain available in YAML.

## YAML Styling

Choose **YAML** to edit the same candidate directly. Monaco loads only when this
mode is activated. The editor provides source-mapped diagnostics, hover help,
target-compatible property and value completion, project icon completion, and
selectors derived from the current topology IDs, labels, and data.

The toolbar can search, reveal the selected object's matching exact-ID rule,
open the source drawer, or format the candidate after an explicit warning.
Formatting may normalize indentation, quoting, and flow-style YAML; it never
runs implicitly. A standalone `?` in a supported property or value position can
open contextual discovery. Comments, quoted strings, block scalars, and URLs are
not treated as discovery requests.

## Candidate Lifecycle

Basic and YAML write only to the candidate until **Apply** is selected. The
fixed footer reports one of these states:

- **Stylesheet applied**: candidate and project stylesheet match;
- **Checking Style draft**: a newer candidate is being checked;
- **Valid Style draft**: the candidate is valid and differs from the project;
- **Invalid Style draft**: the raw candidate is retained, but cannot be applied.

The canvas previews the latest valid candidate. If a newer edit is invalid, the
editor keeps that raw text and its diagnostics while the canvas continues to
render the last valid candidate. **Revert** restores the applied stylesheet.
**Apply** replaces `stylesheet.yaml` as one undoable command and rebases the
candidate onto the new project revision.

Save and export apply a valid dirty candidate first. An invalid candidate blocks
those operations instead of persisting or packaging a stylesheet that the canvas
did not render. Project switching and external file conflicts require an
explicit keep, apply, revert, or reload decision when candidate work would
otherwise be lost.

## Existing Inline Styles

An inline topology style still wins at runtime. Basic reports that provenance
and disables the conflicting field rather than pretending the candidate rule is
visible. Use **Source** to inspect the inline owner or **Move to stylesheet** to
perform one atomic migration: add the exact-ID stylesheet value and remove the
corresponding inline field. Unrelated source text is preserved.

Source edits preserve comments, blank lines, scalar style, aliases, unknown
keys, line endings, and rule order when a safe local mutation exists. Operations
that cannot preserve those properties require an explicit normalization review.
