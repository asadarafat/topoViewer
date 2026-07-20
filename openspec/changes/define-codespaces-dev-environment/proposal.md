## Why

Codespaces should be a repo-wide development environment, not a Grafana
roadmap phase. A contributor should be able to open the repo in a browser and
run the same public surfaces that matter for TopoViewer adoption:

- MkDocs;
- Zensical;
- TopoViewer Studio;
- synthetic Grafana lab;
- Containerlab Grafana lab, when the Codespaces runtime supports the required
  container privileges.

Keeping this separate from the Grafana roadmap prevents one integration from
owning the cloud development story for the whole repository.

## What Changes

Define a Codespaces/devcontainer plan that can run the full TopoViewer repo:

- pin Node.js 24 and the repo toolchain;
- install docs, Playwright, Grafana lab, Docker, and optional Containerlab
  prerequisites;
- expose the standard preview commands and forwarded ports;
- make `npm run docs:preview` serve MkDocs, Zensical, and TopoViewer Studio
  from one preview surface;
- make `npm run studio:dev` work as the focused Studio development server;
- make `npm run grafana:lab:up` work for the deterministic synthetic
  Grafana/Prometheus lab;
- make `npm run grafana:clab:up` explicitly preflight Containerlab support
  before attempting the real telemetry lab;
- document fallback behavior when Codespaces cannot provide the privileges
  needed by Containerlab;
- keep package publishing, tokens, and release automation out of Codespaces
  startup.

## Capabilities

### New Capabilities

- `codespaces-dev-environment`: repo-wide browser development environment for
  docs, Zensical, Studio, Grafana, and Containerlab Grafana validation.

## Impact

- Future `.devcontainer/**` files.
- Future Codespaces setup docs.
- Existing npm scripts and port contracts.
- Grafana lab preflight and documentation.
- No renderer, schema, mapper, or package release behavior changes are required
  by this planning change.

## Non-Goals

- Replacing local development.
- Replacing CI.
- Publishing npm packages from Codespaces startup.
- Auto-exposing forwarded ports publicly.
- Claiming Containerlab works in every hosted Codespaces runtime when required
  privileges are unavailable.
- Making Grafana the owner of the repo-wide cloud development environment.
