# MkDocs Python Package Decision

Decision date: 2026-07-01

Command:

```bash
python3 -m pip index versions mkdocs-topoviewer
```

Observed result:

```text
ERROR: No matching distribution found for mkdocs-topoviewer
```

Decision: do not advertise `pip install mkdocs-topoviewer` as a public user
flow until the Python package is published and verified.

Changes:

- `packages/topoviewer/content/pages/embed/mkdocs.md` now uses editable local
  install from the repository checkout for preview/integration work.
- `scripts/check-install-commands.mjs` fails if public user guides reintroduce
  the PyPI install command before publication.
- Maintainer/package documentation may mention the future PyPI command only as
  a target after publication, not as the current public adoption path.

