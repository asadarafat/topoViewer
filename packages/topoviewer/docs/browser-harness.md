# Browser Harness

**Support status:** Experimental

The browser harness is the fastest way to author and inspect TopoViewer YAML
without embedding it in another product.

## Run It

```bash
npm run vscode:harness
```

For the full docs preview, the harness is also available under the generated
site:

```bash
npm run docs:preview
```

Open `http://127.0.0.1:8001/topoviewer/harness/`.

## Authoring Workflow

1. Choose a template.
2. Edit topology, stylesheet, or mapper YAML.
3. Press `Apply` to validate and render the draft.
4. Use `Revert draft` to discard un-applied edits.
5. Drag nodes only when the layout is manual or pinned.
6. Use `Save` when the topology should survive browser refresh.
7. Use `Download bundle` when you need Grafana-ready source files.
8. Export the viewport when the rendered state is valid.

The canvas always keeps the last valid applied document. A broken draft should
show diagnostics without destroying the current viewport.

The YAML tab has three documents:

| Tab | File role | Grafana bundle suffix |
| --- | --- | --- |
| `Topology YAML` | Graph objects, layers, labels, data, layout hints, attention declarations. | `*.topo.tv.yaml` |
| `Stylesheet YAML` | Icons, label fields, layout options, and selector-driven visual style. | `*.style.tv.yaml` |
| `Mapper YAML` | Runtime telemetry rules that map Grafana data frames to TopoViewer object overlays. | `*.mapper.tv.yaml` |

`Download bundle` validates the draft and writes all three canonical files using
the current graph ID as the filename base. Use those files directly under a
Grafana mounted bundle directory.

## Mapper Coverage Preview

When `Mapper YAML` is active, the harness shows synthetic coverage against the
currently applied topology. It checks whether mapper rules can resolve objects
by ID, selector, labels, data keys, endpoints, aggregate targets, or static
object IDs before the bundle is mounted in Grafana.

The preview reports matched objects, unmatched rules, ambiguous endpoint rules,
duplicate targets, and stale object references. It does not replace Grafana
runtime coverage: Grafana recomputes coverage from real data frames and
Prometheus labels when the panel refreshes.

Use `Presets` in the Mapper YAML action row to insert a starter mapper document.
The comprehensive starter demonstrates ID matching, label matching, data
matching, endpoint matching, selector matching, status and badge overlays, label
overlays, layer aggregates, and graph summary overlays. Presets edit only the
draft; use `Apply` to accept them or `Revert draft` to discard them.

## YAML Assist

Use `Ctrl+Space` or `Cmd+Space` in the editor for completions. Use `?` at
structural YAML positions for candidate keys and short explanations.

The assist model should be indentation-aware:

- root keys are suggested only at root indentation;
- graph keys are suggested under `graph`;
- node, link, path, and region fields are suggested in their own arrays;
- style keys and style values are suggested from the canonical style registry;
- mapper keys, target kinds, resolver modes, object IDs, layer IDs, labels, data
  keys, and overlay style keys are suggested from the mapper schema, style
  metadata, and currently applied topology.

## Export

The harness export button writes a PNG of the current viewport. Export is
disabled when blocking diagnostics prevent a reliable render.

## Next Steps

- [Debug rendering](debugging.md): troubleshoot when the viewport does not match the YAML.
- [Grafana guide](grafana.md): mount exported bundles and apply mapper-driven telemetry overlays.
- [Integration roadmap](integration-roadmap.md): editor extension direction and supported integration surfaces.
