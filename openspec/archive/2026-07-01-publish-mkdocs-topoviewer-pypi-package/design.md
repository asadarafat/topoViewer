## Overview

The MkDocs integration should have the same adoption quality as the npm package:
users install one public package, enable one plugin key, and build their docs.

The right public contract is:

```bash
pip install mkdocs-topoviewer
```

```yaml
plugins:
  - search
  - topoviewer
```

The package name and Python module name intentionally differ:

| Layer | Name | Reason |
| --- | --- | --- |
| PyPI distribution | `mkdocs-topoviewer` | Describes the installable MkDocs adapter. |
| Python import package | `mkdocs_topoviewer` | Python modules cannot contain hyphens. |
| MkDocs plugin key | `topoviewer` | The Markdown authoring surface should use the product name. |

## Publication Model

Publishing must be deliberate and manually triggered.

Use a dedicated GitHub Actions workflow:

```text
.github/workflows/pypi-publish.yml
```

Workflow properties:

- `workflow_dispatch` only;
- input `version`;
- input `dry_run`;
- runs on Node.js 24 and Python 3.12;
- uses the existing npm build/sync gates to ensure vendored embed assets are
  current;
- builds both wheel and source distribution;
- runs package artifact inspection;
- runs `twine check`;
- checks PyPI to reject immutable already-published versions for real publish;
- uses PyPI Trusted Publishing/OIDC for upload when `dry_run == false`;
- uses a GitHub environment named `pypi-publish`;
- requires no PyPI token, no GitHub secret, and no checked-in credential.

## PyPI Trusted Publishing Setup

The first real publish requires one manual PyPI-side setup step:

1. Create or configure the PyPI project/pending publisher for
   `mkdocs-topoviewer`.
2. Set publisher owner/repository to `asadarafat/topoviewer`.
3. Set workflow filename to `pypi-publish.yml`.
4. Set environment to `pypi-publish`.
5. Dispatch the GitHub workflow with `dry_run=false`.

This is intentionally separate from GitHub secrets. A secret named
`PYPI_TOKEN` should not be required.

## Artifact Build Contract

The Python package vendors the approved browser embed bundle:

```text
packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.css
packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.iife.js
packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-mkdocs.css
```

Before building the Python artifact, the release workflow must ensure those
files are synced from the current renderer build. The artifact inspection must
reject:

- missing vendored assets;
- `build/`, `.egg-info/`, `__pycache__/`, or `.pyc` files inside artifacts;
- missing MkDocs entry point;
- missing license/readme metadata;
- package names other than `mkdocs-topoviewer`;
- version mismatch against the manual workflow input.

The local artifact build should create an isolated virtual environment under
`.artifacts/` for Python release tooling. It should not install `build`,
`twine`, or publishing dependencies into the user or system Python environment.

The package can use Hatchling for this small adapter boundary when that keeps
the produced wheel and sdist cleaner than setuptools. The public contract is
the package metadata, vendored assets, and MkDocs entry point, not a specific
Python build backend.

## Clean Install Smoke

After publish, verification must use a clean virtual environment, not the repo
checkout:

```bash
python -m venv /tmp/topoviewer-mkdocs-smoke
/tmp/topoviewer-mkdocs-smoke/bin/python -m pip install --upgrade pip
/tmp/topoviewer-mkdocs-smoke/bin/python -m pip install mkdocs-topoviewer
```

Then build a minimal MkDocs site that uses:

```yaml
plugins:
  - search
  - topoviewer
```

and one Markdown page containing a `topoviewer` fenced block with local
topology and stylesheet YAML.

The smoke passes only when the generated site includes the vendored
TopoViewer embed CSS/JS and the page renders a TopoViewer container without
needing npm.

## Documentation Switch-Over

Before PyPI publish, public docs must not claim:

```bash
pip install mkdocs-topoviewer
```

as the current user install path.

After PyPI publish and clean install smoke pass, update public docs so the
MkDocs page starts with the PyPI install command. Local editable install remains
only in maintainer/development docs.

## Guardrail Switch-Over

The existing install-command guardrail currently blocks `pip install
mkdocs-topoviewer` in public user docs because the package is not live. This
change must invert that behavior after publication:

- public MkDocs user docs SHOULD use `pip install mkdocs-topoviewer`;
- local editable install MUST be limited to maintainer/development docs;
- `pip install topoviewer` MUST NOT be documented for MkDocs;
- `mkdocs-topoviewer` MUST remain the only public PyPI distribution name.

## Release Ordering

The first release sequence should be:

1. Build and sync the npm embed bundle.
2. Build wheel and sdist for `mkdocs-topoviewer`.
3. Inspect artifacts and run metadata checks.
4. Run workflow dry-run.
5. Configure PyPI Trusted Publishing/pending publisher.
6. Run workflow real publish for `0.1.0`.
7. Verify `pip install mkdocs-topoviewer` from a clean environment.
8. Update public docs and guardrails.
9. Run local `npm run ci`.
10. Commit, push, and verify GitHub CI/Docs/Security/CodeQL.

## Risk Controls

- Do not publish until the workflow dry-run and local artifact checks pass.
- Do not use TestPyPI as proof that production PyPI install works; it can be an
  extra rehearsal, but the final acceptance requires production PyPI.
- Do not make docs claim the package is live until the production install smoke
  passes.
- Do not store PyPI credentials in the repository or GitHub secrets.
- Keep npm and PyPI releases independent even when versions are aligned.
