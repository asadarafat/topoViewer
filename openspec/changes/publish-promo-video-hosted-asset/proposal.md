# Publish Promo Video Hosted Asset

## Why

`harden-public-adoption-readiness` can generate and review the promotional
walkthrough locally, but the final README video needs a durable public URL.
That upload is intentionally a post-review publishing step so `.artifacts/`
video files never become repository content.

## What Changes

- Upload the reviewed promo WebM or regenerated final recording to a durable
  GitHub-hosted media location, such as a dedicated media issue.
- Update the generated README source so the first screen uses the hosted video
  link when available and keeps the checked-in poster as fallback.
- Verify playback from the rendered GitHub README after the change is pushed.

## Out Of Scope

- Reworking the storyboard.
- Checking local `.artifacts/` media into git.
- Making promo recording part of every push.
