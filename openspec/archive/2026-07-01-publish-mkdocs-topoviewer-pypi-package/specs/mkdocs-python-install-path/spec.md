# mkdocs-python-install-path Specification

## Requirements

### Requirement: Public PyPI Distribution

TopoViewer SHALL publish the MkDocs adapter as the PyPI distribution
`mkdocs-topoviewer`.

#### Scenario: Installable from PyPI

Given `mkdocs-topoviewer==0.1.0` has been published to PyPI
When a user runs `python -m pip install mkdocs-topoviewer` in a clean Python
environment
Then pip SHALL install the package without requiring a repository checkout
And the installed package SHALL include the `topoviewer` MkDocs plugin entry
point
And the installed package SHALL include the vendored TopoViewer embed CSS and
JavaScript assets.

#### Scenario: Product name is not reused as Python distribution

Given the MkDocs adapter is a Python package
When public docs describe MkDocs installation
Then the install command SHALL be `pip install mkdocs-topoviewer`
And the docs MUST NOT describe `pip install topoviewer` as the MkDocs adapter
install path.

### Requirement: Python Module Naming

The Python import package SHALL remain `mkdocs_topoviewer`.

#### Scenario: Hyphenated distribution maps to underscore import package

Given Python modules cannot use hyphens
When the package is installed from the `mkdocs-topoviewer` distribution
Then Python SHALL expose the import package `mkdocs_topoviewer`
And MkDocs SHALL load the plugin through the `topoviewer` entry point.

### Requirement: Manual Trusted Publishing

The PyPI release SHALL be manually triggered and SHALL use trusted publishing
instead of checked-in credentials.

#### Scenario: Dry-run validates release gates

Given a maintainer dispatches the PyPI publish workflow with `dry_run=true`
When the requested version matches `packages/mkdocs-topoviewer/pyproject.toml`
Then the workflow SHALL build the renderer assets, sync the MkDocs vendored
assets, build wheel and source distribution artifacts, inspect them, and run
metadata validation
And the workflow SHALL NOT upload to PyPI.

#### Scenario: Real publish uses OIDC

Given PyPI has a trusted publisher or pending publisher configured for
`mkdocs-topoviewer`
And the maintainer dispatches the workflow with `dry_run=false`
When the requested version is not already published
Then the workflow SHALL publish the Python artifacts through PyPI Trusted
Publishing/OIDC
And the workflow MUST NOT require a `PYPI_TOKEN` repository secret.

#### Scenario: Existing versions are immutable

Given `mkdocs-topoviewer@<version>` is already published on PyPI
When a maintainer dispatches the real publish workflow for the same version
Then the workflow SHALL fail before upload with an actionable version immutability
message.

### Requirement: Clean Install Smoke

The release SHALL be verified from a clean Python environment after production
PyPI publication.

#### Scenario: Minimal MkDocs site builds after pip install

Given `mkdocs-topoviewer` is installed from PyPI in a clean virtual environment
And a minimal MkDocs site enables the `topoviewer` plugin
And a Markdown page contains a `topoviewer` fenced block pointing to local YAML
When `mkdocs build` runs
Then the generated site SHALL contain a TopoViewer embed container
And the generated site SHALL include the vendored TopoViewer CSS and JavaScript
assets
And no npm install or repository checkout SHALL be required.

### Requirement: Documentation Switch-Over

Public docs SHALL advertise the PyPI install path only after it is verified.

#### Scenario: Before publication

Given `mkdocs-topoviewer` is not available on PyPI
When public user docs are generated
Then those docs MUST NOT present `pip install mkdocs-topoviewer` as the current
public adoption path.

#### Scenario: After publication

Given `mkdocs-topoviewer` is available on PyPI
And the clean install smoke passes
When public docs are generated
Then the MkDocs guide SHALL start with `pip install mkdocs-topoviewer`
And local editable install instructions SHALL appear only in maintainer or
development documentation.

### Requirement: Guardrails

The repository SHALL prevent MkDocs install-path drift.

#### Scenario: Wrong public install command is introduced

Given a public user-facing document contains `pip install topoviewer` for MkDocs
When public-readiness guardrails run
Then the guardrail SHALL fail and explain that the MkDocs adapter distribution
is `mkdocs-topoviewer`.

#### Scenario: Local editable install leaks into public user docs

Given a public user-facing document contains `pip install -e
packages/mkdocs-topoviewer`
When public-readiness guardrails run after PyPI publication
Then the guardrail SHALL fail unless the document is explicitly a maintainer or
development workflow page.
