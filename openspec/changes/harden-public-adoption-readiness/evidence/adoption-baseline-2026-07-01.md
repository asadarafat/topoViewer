# Adoption Baseline

Date: 2026-07-01

Commands:

```bash
gh repo view asadarafat/topoviewer --json nameWithOwner,stargazerCount,forkCount,watchers,issues,latestRelease,url
npm view topoviewer version dist-tags time --json
gh release view v0.1.0 --repo asadarafat/topoviewer --json tagName,name,isPrerelease,url,publishedAt,targetCommitish
gh issue list --repo asadarafat/topoviewer --state all --limit 20 --json number,title,state,createdAt,updatedAt,url
```

Observed baseline:

| Signal | Value |
|---|---|
| Repository | `asadarafat/topoviewer` |
| Stars | 21 |
| Forks | 6 |
| Watchers | 1 |
| Open issues | 1 |
| npm package | `topoviewer@0.1.0` |
| npm dist-tags | `latest: 0.1.0`, `next: 0.1.0` |
| npm publish time | 2026-07-01T12:15:15Z |
| GitHub release | `v0.1.0` |
| Release type | prerelease |
| Release URL | https://github.com/asadarafat/topoviewer/releases/tag/v0.1.0 |

GitHub `latestRelease` is empty because `v0.1.0` is intentionally marked as a
prerelease. The release tag exists and points at the pushed `development`
commit.

First-user install issue:

| Issue | Status | Decision |
|---|---|---|
| https://github.com/asadarafat/topoviewer/issues/68 | Open | Original `npm ERR! 404` cause is resolved by publishing `topoviewer@0.1.0`; issue can be answered with the public install command and release link. |

