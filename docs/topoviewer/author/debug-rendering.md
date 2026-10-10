# Debug Rendering

Start with the visible diagnostic and the smallest source pair that reproduces
the problem. [Validate the files](validate-yaml.md) before changing the layout.
Keep invalid Studio drafts backed up; a last-valid preview does not prove a
draft has been applied.

## Blank Viewport

| Symptom | Check and action | Verify |
|---|---|---|
| YAML asset returns 404 | Open the topology URL in the browser's Network panel. MkDocs fence paths resolve from the Markdown source; static HTML paths resolve from the rendered page URL. Correct the path or deployment prefix. | Both source requests return 200 and contain YAML. |
| Parse or schema diagnostic | Follow the diagnostic's document and field; check indentation, model version, and topology/stylesheet ownership. | The file validator succeeds and the diagnostic disappears. |
| Valid source, no objects | Select a declared layer. Give every visible object a nonempty `layers` list. | Enabling that layer reveals its nodes and links. |
| Objects outside the view | Choose **Fit View**. For manual layout, check finite coordinates and positive dimensions. | The intended objects appear together. |
| Works locally, fails after publishing | Serve the built site over HTTP and open the same nested URL. Check the project prefix and blocked asset requests. | A fresh browser visit renders without manual refresh. |

## Missing Links

A link needs valid `source` and `target` IDs, a selected layer, and visible
endpoints. A `broken-target` diagnostic identifies an unknown target. Repair the
reference, then run the validator again. If it validates but remains hidden,
check `display`, opacity, attention mode, and layer membership on both nodes.

**Check:** show the link and endpoints, then toggle their layer off and on. The
relationship should disappear and return without changing the source IDs.

## Bad Selectors

Use the exact object kind and a fact present in the source, for example
`node[labels.role = "pe"]`. Keys are case-sensitive and canonical style keys use
camelCase. A more specific rule or a later rule of equal specificity may replace
the value you edited. Inspect the matched rules in Studio's
[style provenance](studio/style-provenance.md).

**Check:** edit one unambiguous matching rule and confirm that only the expected
objects change. Restore it before continuing.

## Icon Or Label Alignment

Confirm `topoviewer/style.css` is imported in React hosts. Avoid global host CSS
that changes SVG sizing, button dimensions, or TopoViewer node box geometry.
Use theme variables for colors. Compare the same source in Studio and your host
to isolate a host stylesheet problem.

On a small screen, choose **Expand diagram**, then **Fit View** and zoom to read
individual objects. Press Escape to return. A fitted overview is not a substitute
for reading the scenario's text and legend.

## Renderer Limits And No Data

A `renderer-limit` diagnostic prevents oversized input from mounting. Reduce
the source view, use layers or aggregate summaries, or deliberately raise the
[limits](../reference/objects/limits.md) within your host's measured capacity.
[Performance guidance](../evaluate/performance-reliability-accessibility.md)
describes the current budgets.

In Grafana, a visible base topology with missing overlays is a data/mapping
problem. Check query frames, join IDs, mapper coverage, and no-data diagnostics
in the [panel guide](../examples/use-cases/grafana-topoviewer-panel.md).

## Report A Reproducible Problem

Include the installed version, docs host, browser, diagnostic code, minimal
sanitized topology and stylesheet, and the expected visible result. Attach an
image when placement matters. Include the same source pair with that image so
the result can be reproduced. See [Studio Troubleshooting](studio/troubleshooting.md)
for save, draft recovery, and browser-storage failures.
