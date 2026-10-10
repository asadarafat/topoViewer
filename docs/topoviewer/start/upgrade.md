# Upgrade a project

Back up your topology, stylesheet, mapper, and local assets before changing a
package version. Keep the source files as well as image exports.

## Choose And Install A Version

Read the target version's [release notes](https://github.com/asadarafat/topoviewer/releases)
and [compatibility policy](../reference/compatibility.md). For npm applications,
update `topoviewer` to that explicit version and commit the resulting lockfile.
For MkDocs, install the matching `mkdocs-topoviewer` version in your virtual
environment and freeze your Python dependencies. Zensical sites must replace
both embed CSS and JavaScript together.

Do not assume that the [development docs](documentation-versions.md) describe
every feature in your installed release.

## Migrate Legacy YAML

Canonical bundles use model version `"0.2"`, `labels.name` for visible aliases,
and separate topology and stylesheet files. Legacy names and inline styles need
explicit migration. The repository migration tool is documented in
[Identity and file ownership](../author/identity-and-source-ownership.md#migrate-legacy-bundles).
That command runs from a repository checkout; it is not an installed npm CLI.
Review its preview before using `--write`, and retain the original files.

## Verify Before Publishing

1. [Validate both files](../author/validate-yaml.md). Repair schema and semantic
   errors; investigate new warnings.
2. Open a representative diagram and confirm IDs, connectivity, labels, layers,
   paths, and operational status remain correct in light and dark mode.
3. In a React app, check selection callbacks, data updates, error fallbacks,
   viewport restoration, and image export.
4. In documentation, build with `mkdocs build --strict` or `zensical build`,
   serve the output over HTTP, and test a nested diagram URL.
5. In Studio, export and reopen an archive. Confirm the applied source and
   local assets survived the round trip.

If the checks fail, restore the previous dependency lockfile/environment and
source backup, rebuild, and repeat the same checks. Report the previous and
new versions, diagnostic code, browser, and a minimal sanitized source pair.
