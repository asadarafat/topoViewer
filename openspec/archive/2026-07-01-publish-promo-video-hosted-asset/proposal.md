# Publish Promo Video Hosted Asset

Status: Deprecated before implementation.

Decision: Do not favor a hosted promo video for the public first impression.
Use the checked-in collage as the durable README asset. Keep generated video,
MP4, WebM, or GIF files as local review artifacts only.

## Why

`harden-public-adoption-readiness` originally planned a post-review hosted
video upload. That is no longer the desired public artifact. The public README
should favor the generated collage because it is checked into `docs/assets/`,
loads reliably on GitHub, and immediately shows the same TopoViewer YAML across
the harness, MkDocs, Zensical, and Grafana surfaces.

## What Changes

- Archive this change as superseded by the collage-first public adoption plan.
- Keep any generated video/GIF/MP4 files out of git and out of public docs.
- Keep `docs/assets/topoviewer-yaml-to-graph-collage.png` as the durable public
  README media asset.

## Out Of Scope

- Reworking the storyboard.
- Checking local `.artifacts/` media into git.
- Making promo recording part of every push.
