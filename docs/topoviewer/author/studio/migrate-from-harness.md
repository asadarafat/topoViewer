# Migrate From Harness

**Support status:** Experimental

Studio and the Browser Harness consume the same TopoViewer YAML contract. The
migration changes the authoring shell, not the topology model.

## Move A Bundle

1. In the Harness, apply and validate topology, stylesheet, and mapper drafts.
2. Download the canonical bundle.
3. Create a Studio project and import a `.tvstudio` archive or open a supported
   source folder. Until a direct Harness-to-Studio archive bridge is published,
   use the YAML drawer to place canonical files into the project.
4. Confirm object IDs, layer visibility, style, mapper coverage, and assets.
5. Export the Studio project and render it in the original consumer before
   replacing the authoring workflow.

## Where Harness Controls Moved

| Harness area | Studio area |
|---|---|
| Build | Object palette, canvas toolbar, and selection commands |
| Inspect | Selection-driven Inspector |
| YAML | Lazy Workspace drawer |
| Attention | Inspector/document controls and canvas overlays |
| Layers | Canvas settings plus layer Inspector controls |
| Download bundle | Project archive and Export panel |

Studio intentionally removes fixture-revert behavior, the permanent resizable
rail, and mode-first tabs. Browser projects have save, reload, recovery, and
archive semantics instead. Curated examples remain import sources rather than
mutable fixture state.

Keep the Harness available during evaluation. Studio remains experimental until
the preview release, remote CI, rollback, and support-promotion gates are
complete. A successful YAML round trip is necessary but not sufficient; verify
the actual MkDocs, Zensical, React, or Grafana consumer used by the team.
