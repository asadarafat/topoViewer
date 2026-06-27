# Browser Harness

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
2. Edit topology or stylesheet YAML.
3. Press `Apply` to validate and render the draft.
4. Use `Revert draft` to discard un-applied edits.
5. Drag nodes only when the layout is manual or pinned.
6. Use `Save` when the topology should survive browser refresh.
7. Export the viewport when the rendered state is valid.

The canvas always keeps the last valid applied document. A broken draft should
show diagnostics without destroying the current viewport.

## YAML Assist

Use `Ctrl+Space` or `Cmd+Space` in the editor for completions. Use `?` at
structural YAML positions for candidate keys and short explanations.

The assist model should be indentation-aware:

- root keys are suggested only at root indentation;
- graph keys are suggested under `graph`;
- node, link, path, and region fields are suggested in their own arrays;
- style keys and style values are suggested from the canonical style registry.

## Export

The harness export button writes a PNG of the current viewport. Export is
disabled when blocking diagnostics prevent a reliable render.

Next: [Debug rendering](debugging.md) when the viewport does not match the YAML.
