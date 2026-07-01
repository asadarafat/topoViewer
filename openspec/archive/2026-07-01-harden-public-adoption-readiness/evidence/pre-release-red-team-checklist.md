# Pre-Release Red-Team Checklist

Run this before any release or public readiness claim.

## Install And Package

- Run `npm ci` on a clean checkout with Node.js 24.
- Run `npm run install:check`.
- Run `npm run pack:check`.
- Inspect npm package contents with artifact autopsy.
- Verify README install commands match the real package publish state.

## Docs And Embeds

- Run `npm run docs:build:parallel`.
- Run `npm run docs:smoke`.
- Run `npm run render:parity`.
- Open representative MkDocs and Zensical pages manually.
- Confirm no page references local paths, `.artifacts`, private screenshots, or stale route casing.

## Harness Authoring

- Start the browser harness.
- Create a new topology.
- Edit topology, stylesheet, and mapper YAML.
- Apply, revert, refresh, export, and copy files.
- Confirm invalid drafts do not corrupt the last valid preview.

## Grafana

- Start the mounted-bundle lab.
- Mount a harness-authored bundle without fixture sync or catalog edits.
- Select a bundle.
- Send healthy, degraded, failed, and no-data telemetry.
- Confirm mapper coverage reports resolved, unresolved, ambiguous, duplicate, and stale states.

## Hostile Content

- Run `npm run test:hostile-content`.
- Add one new SVG or label attack variant before release.
- Verify docs embeds and Grafana panel surfaces remain inert where covered.

## Accessibility And Usability

- Check visible focus in light and dark mode.
- Check keyboard escape from dialogs, editors, and suggestions.
- Check non-color cues for status overlays.
- Check text legibility at common viewport sizes.

## Release Decision

- Record failed checks with owners.
- Record accepted risks with owner and expiration.
- Do not archive `harden-public-adoption-readiness` while unresolved risks lack a named follow-up OpenSpec or accepted-risk owner.
