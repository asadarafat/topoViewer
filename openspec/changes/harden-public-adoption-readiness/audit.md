## Brutal Audit

Current state: TopoViewer is technically promising, but its public surface is
too noisy for broad adoption.

### Strengths

- The core idea is differentiated: topology as code for semantic, inspectable
  network, infrastructure, and service diagrams.
- The renderer has real substance: YAML schemas, selector stylesheets,
  attention, layout, examples, docs embeds, harness, React API, and Grafana
  direction.
- Examples are unusually test-backed for an early open-source diagramming
  project.
- The canonical content root under `packages/topoviewer/content/**` is the
  right foundation for DRY docs and examples.

### Weaknesses

- The repo currently presents too much implementation ambition at the front
  door: renderer, YAML spec, docs plugin, Zensical, VS Code, Grafana, OpenSpec,
  Containerlab, layout engines, and labs all compete for attention.
- First-time users cannot immediately tell what is stable today versus
  experimental or roadmap.
- Public nav mixes beginner docs, generated examples, reference, release,
  production hardening, monorepo internals, and documentation standards.
- Generated example pages read like test-case catalog output. That is useful
  internally, but it does not feel like a curated public learning path.
- The README is directionally correct, but still too much product explanation
  and not enough "copy this YAML, render this diagram, embed it here."
- The README uses a static image where the product would benefit from a short,
  playable walkthrough showing YAML changing into a graph across the actual
  supported surfaces.
- Integration messaging can drift. For example, Grafana implementation has
  moved beyond early phases, but shared public wording can still read as Phase 2.

### Adoption Risks

- High-bar engineers may classify the project as a research workspace before
  they see the stable core.
- The number of surfaces makes the project look harder to adopt than it is.
- Roadmap visibility is good, but roadmap material must not obscure the
  install-and-embed path.
- If docs remain mechanically generated in the main learning path, the project
  will feel less polished than the renderer deserves.

### Target Signal

The first ten minutes should communicate:

1. what TopoViewer is;
2. how it differs from Mermaid.js and raw React Flow;
3. how to render the first topology;
4. how to embed it in React or docs;
5. how the same YAML appears in MkDocs, Zensical, harness, and Grafana;
6. which YAML/schema/API contracts are stable;
7. which integrations are supported, experimental, lab-only, or roadmap;
8. why the examples are trustworthy and CI-backed.

### Product Thesis

TopoViewer should present itself as:

```text
Topology as Code for semantic, interactive diagrams.
```

The supporting claim:

```text
Keep topology facts in YAML, keep presentation in reusable stylesheets, and
render the same model in docs, apps, authoring tools, and operational dashboards.
```
