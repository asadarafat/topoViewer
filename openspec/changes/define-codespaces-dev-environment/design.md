## Overview

The Codespaces environment should optimize for fast public-product review:
open the repo, install dependencies, run the docs, inspect Studio, and run
the Grafana labs with clear preflight behavior.

The important split is between deterministic browser/dev surfaces and
privileged lab surfaces:

```text
Codespaces workspace
  -> Node 24 + npm ci
  -> Python docs toolchain
  -> Playwright Chromium
  -> Docker runtime
  -> optional Containerlab privilege preflight
```

## Environment Contract

The environment should provide:

- Node.js 24 LTS;
- npm using the checked-in lockfile;
- Python and docs dependencies needed by MkDocs;
- Playwright browser dependencies;
- Docker CLI/runtime access for Grafana labs;
- optional Containerlab install or documented install hook;
- shell startup that prints useful commands but does not start long-running
  services automatically.

The setup should not require maintainer secrets for normal development.

## Supported Surfaces

### Docs Preview

`npm run docs:preview` should be the primary public preview command.

It should expose:

- MkDocs at `/topoviewer/docs/mkdocs`;
- Zensical at `/topoviewer/docs/zensical`;
- TopoViewer Studio at `/topoviewer/studio`.

This is the quickest path for reviewing public docs parity.

### TopoViewer Studio Dev Server

`npm run studio:dev` should run the focused Studio dev server for authoring UI
work. Codespaces docs should describe that the printed Vite URL is the source
of truth because Codespaces may remap forwarded ports.

### Synthetic Grafana Lab

`npm run grafana:lab:up` should start the deterministic Grafana/Prometheus
lab. It should work without Containerlab and without generated fixture sync as
a production-shaped mounted-bundle smoke.

Expected local services:

- Grafana;
- Prometheus;
- telemetry injector.

Exact ports should remain owned by the npm scripts and documented in the lab
README. Codespaces documentation should explain how to open forwarded ports.

### Containerlab Grafana Lab

`npm run grafana:clab:up` should perform a privilege and dependency preflight
before starting any Containerlab topology.

If the runtime cannot support Containerlab, the command should fail with a
clear explanation and point users back to the synthetic Grafana lab. It should
not partially start an unclear broken lab.

## Tiered Acceptance

Use tiers so partial support is honest:

| Tier | Scope | Acceptance |
| --- | --- | --- |
| 0 | Repo bootstrap | `npm ci` and `npm run ci:quality` pass. |
| 1 | Docs bundle | `npm run docs:preview` serves MkDocs, Zensical, and Studio paths. |
| 2 | Studio development | `npm run studio:dev` opens and supports visual and YAML authoring workflows. |
| 3 | Synthetic Grafana | `npm run grafana:lab:up` and the phase smoke pass. |
| 4 | Containerlab Grafana | Containerlab preflight passes and the real telemetry lab smoke passes. |

Tier 4 is allowed to be unavailable on a hosted runtime if privileges are
insufficient, but the failure must be explicit and documented.

## Port Forwarding

Codespaces documentation should list the repo commands, not hard-coded
browser URLs as the only source of truth. Where URLs are shown, they should be
described as local defaults that Codespaces forwards:

- docs preview command: local default `8001`;
- Studio dev command: Vite printed URL;
- Grafana lab: local default Grafana and Prometheus ports from the lab script;
- Containerlab Grafana: local default Grafana, Prometheus, gNMIc, and
  normalizer ports from the lab script.

## Security And Release Boundary

Codespaces startup must not:

- publish npm packages;
- require npm tokens;
- require GitHub release tokens;
- expose ports publicly by default;
- embed maintainer-only secrets.

Package publishing belongs to the public-adoption readiness/release workflow
and must remain a deliberate manual operation.

## Validation Strategy

The first implementation should add a lightweight smoke script or documented
manual checklist that runs:

```text
npm ci
npm run ci:quality
npm run docs:preview
npm run studio:dev
npm run grafana:lab:up
npm run grafana:lab:down
npm run grafana:clab:preflight
```

The Containerlab preflight should be separate so Codespaces can clearly report
whether the hosted environment can run the real lab.
