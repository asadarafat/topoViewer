## Promo Recording Evidence

Date: 2026-06-30

Command:

```bash
npm run promo:record
```

Result:

- Passed.
- Local review video written to `.artifacts/promo/topoviewer-yaml-to-graph-demo.webm`.
- Local review poster written to `.artifacts/promo/topoviewer-yaml-to-graph-demo.png`.
- Checked-in README fallback poster copied to `docs/assets/topoviewer-yaml-to-graph-demo.png`.

Closeout decision:

- The local deterministic recording requirement is complete.
- The durable hosted video upload and rendered GitHub README playback check are
  deferred to `openspec/changes/publish-promo-video-hosted-asset` because they
  require a reviewed public upload after repository publication.
