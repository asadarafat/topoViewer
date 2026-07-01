# Phase 1. Baseline And Naming Preflight

Do this first. These tasks prevent the wrong package-name decision from leaking
into implementation.

- [x] 1.1 Confirm PyPI availability for `mkdocs-topoviewer`
- [x] 1.2 Confirm `topoviewer` remains the npm/React package name only
- [x] 1.3 Confirm the Python import package remains `mkdocs_topoviewer`
- [x] 1.4 Confirm the MkDocs plugin key remains `topoviewer`
- [x] 1.5 Document the naming contract: distribution `mkdocs-topoviewer`, module `mkdocs_topoviewer`, plugin key `topoviewer`
- [x] 1.6 Confirm public docs do not say `pip install topoviewer` for MkDocs
- [x] 1.7 Confirm public docs do not advertise `pip install mkdocs-topoviewer` as live before PyPI publication

# Phase 2. Local Artifact Hardening

Do this before adding or running any publish workflow. The local package contract
must be credible first.

- [x] 2.1 Add or update Python artifact build command for wheel and sdist
- [x] 2.2 Add or update artifact inspection to cover wheel and sdist
- [x] 2.3 Add metadata validation with `twine check` or equivalent
- [x] 2.4 Verify package metadata: name, version, license, readme, project URLs, classifiers, dependencies, and entry point
- [x] 2.5 Verify vendored embed assets are present and current before artifact build
- [x] 2.6 Reject generated `build/`, `.egg-info/`, `__pycache__/`, and `.pyc` content from artifacts
- [x] 2.7 Run `npm run wheel:mkdocs`
- [x] 2.8 Run `npm run inspect:wheel`
- [x] 2.9 Record local artifact names and inspection output in OpenSpec evidence

# Phase 3. Manual PyPI Publish Workflow

Do this after local artifact hardening. The workflow should automate the same
checks that passed locally.

- [x] 3.1 Add `.github/workflows/pypi-publish.yml`
- [x] 3.2 Add `workflow_dispatch` inputs for `version` and `dry_run`
- [x] 3.3 Run Node.js 24 and Python 3.12 in the workflow
- [x] 3.4 Verify requested version matches `packages/mkdocs-topoviewer/pyproject.toml`
- [x] 3.5 Check whether the requested PyPI version already exists
- [x] 3.6 Run repository/package gates needed to prove vendored assets and docs plugin behavior
- [x] 3.7 Build wheel and sdist artifacts
- [x] 3.8 Inspect artifacts and run metadata validation
- [x] 3.9 For dry-run, stop before upload and report artifact names
- [x] 3.10 For real publish, upload with PyPI Trusted Publishing/OIDC through environment `pypi-publish`
- [x] 3.11 Reject real publish for an already-published immutable version
- [x] 3.12 Document PyPI pending-publisher setup without requiring `PYPI_TOKEN`

# Phase 4. Workflow Dry-Run

Do this before configuring or using production PyPI trusted publishing.

- [x] 4.1 Commit and push the workflow and artifact hardening changes
- [x] 4.2 Dispatch `pypi-publish.yml` with `version=0.1.0` and `dry_run=true`
- [x] 4.3 Verify the dry-run builds wheel and sdist artifacts
- [x] 4.4 Verify the dry-run runs artifact inspection and metadata validation
- [x] 4.5 Verify the dry-run does not upload to PyPI
- [x] 4.6 Record dry-run workflow URL and result in OpenSpec evidence

# Phase 5. PyPI Trusted Publishing Setup

Do this only after the dry-run workflow is credible.

- [ ] 5.1 Configure PyPI trusted publisher or pending publisher for `mkdocs-topoviewer`
- [ ] 5.2 Use repository `asadarafat/topoviewer`
- [ ] 5.3 Use workflow file `pypi-publish.yml`
- [ ] 5.4 Use environment `pypi-publish`
- [ ] 5.5 Confirm no `PYPI_TOKEN` repository secret is required
- [ ] 5.6 Record the PyPI trusted publishing setup decision in OpenSpec evidence

# Phase 6. Real PyPI Publish

Do this only after PyPI Trusted Publishing is configured.

- [ ] 6.1 Dispatch `pypi-publish.yml` with `version=0.1.0` and `dry_run=false`
- [ ] 6.2 Verify the workflow rejects publish if `0.1.0` already exists
- [ ] 6.3 Verify the workflow publishes through PyPI Trusted Publishing/OIDC
- [ ] 6.4 Verify `mkdocs-topoviewer==0.1.0` is visible on production PyPI
- [ ] 6.5 Record PyPI package URL, version, artifact hashes, and workflow URL in OpenSpec evidence

# Phase 7. Production Clean Install Smoke

Do this after the real PyPI publish. This is the proof that public docs can
switch to the PyPI install path.

- [ ] 7.1 Add a clean virtualenv smoke script for `pip install mkdocs-topoviewer`
- [ ] 7.2 Generate a minimal MkDocs site in a temporary directory
- [ ] 7.3 Enable the `topoviewer` plugin and render one fenced `topoviewer` block
- [ ] 7.4 Assert generated site includes the TopoViewer embed container
- [ ] 7.5 Assert generated site includes vendored embed CSS and JavaScript
- [ ] 7.6 Prove the smoke does not require npm or repository-local editable install
- [ ] 7.7 Run the smoke against production PyPI
- [ ] 7.8 Record smoke command and output in OpenSpec evidence

# Phase 8. Documentation Switch-Over

Do this only after production PyPI install smoke passes.

- [ ] 8.1 Update `packages/mkdocs-topoviewer/README.md` with the verified PyPI install path
- [ ] 8.2 Update `packages/topoviewer/content/pages/embed/mkdocs.md` so the MkDocs guide starts with `pip install mkdocs-topoviewer`
- [ ] 8.3 Keep local editable install guidance only in maintainer/development docs
- [ ] 8.4 Update release docs to treat npm and PyPI as separate manual releases
- [ ] 8.5 Update monorepo docs to show the verified PyPI contract
- [ ] 8.6 Update integration roadmap/support-status wording if needed
- [ ] 8.7 Run content sync so generated docs match canonical content

# Phase 9. Guardrail Switch-Over

Do this after docs switch-over. Guardrails should enforce the new public truth.

- [ ] 9.1 Flip `scripts/check-install-commands.mjs` from blocking `pip install mkdocs-topoviewer` to enforcing it in public MkDocs docs after publication
- [ ] 9.2 Fail if public docs use `pip install topoviewer` for MkDocs
- [ ] 9.3 Fail if local editable Python install appears outside maintainer/development docs
- [ ] 9.4 Include the clean install smoke in the relevant release/public-readiness gate
- [ ] 9.5 Add or update release artifact checks for Python package artifacts

# Phase 10. Final Validation And Archive

Do this last.

- [ ] 10.1 Run `npm run wheel:mkdocs`
- [ ] 10.2 Run `npm run inspect:wheel`
- [ ] 10.3 Run the production clean PyPI install smoke
- [ ] 10.4 Run `npm run ci:public-readiness`
- [ ] 10.5 Run `npm run ci`
- [ ] 10.6 Commit and push
- [ ] 10.7 Verify remote CI, Docs, Security, and CodeQL pass
- [ ] 10.8 Archive this change only after PyPI publication, public docs switch-over, local validation, and remote validation are complete
