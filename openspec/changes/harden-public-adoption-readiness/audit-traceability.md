## Audit Traceability

This file maps the findings in `audit.md` to concrete tasks in `tasks.md`.
The change should not be archived until every row is either complete, deferred
to a named follow-up OpenSpec, or accepted with an explicit risk owner.

| Audit area | Required action tasks |
| --- | --- |
| Adoption Scorecard | 25.1-25.3, 25.17 |
| V0.1 Public Product Gap | 25.1-25.18 |
| Public Adoption Readiness Blockers | 25.4-25.18 |
| Docs Conversion Audit | 26.1-26.25 |
| Brutal Truth: Early-Adopter Adoption Gaps | 1.1-1.8, 2.1-2.8, 3.1-3.8, 4.1-4.6, 18.1-18.8 |
| Why A Serious Evaluator Still Says No | 20.1-20.8, 21.1-21.10, 22.1-22.10, 23.1-23.6 |
| Required Product Correction | 3.1-3.8, 5.1-5.7, 6.9-6.17, 8.1-8.22, 10.1-10.12, 25.4-25.18 |
| Public Documentation And Ergonomics Smells | 1.3-1.4, 2.1-2.8, 3.1-3.8, 5.1-5.7, 6.1-6.17, 8.19-8.20, 10.10-10.12, 11.1-11.7, 26.1-26.25 |
| Committed-Tree Closeout Gate | 24.17, 24.23, 27.1-27.6 |
| Integration Surface Smells | 4.1-4.6, 6.5-6.17, 8.1-8.22, 10.1-10.12, 16.1-16.13, 25.4-25.6 |
| Lab Security Smells | 1.5, 10.1-10.8, 11.1-11.7, 13.7, 15.6 |
| Plugin Artifact And Release Smells | 14.1-14.6, 15.5-15.7, 16.1-16.8 |
| Dependency And Supply-Chain Smells | 1.6, 15.1-15.16, 24.10, 24.16 |
| Backend Resource Endpoint Smells | 13.1-13.8, 24.8 |
| YAML, Mapper, SVG, And HTML Attack Surface | 1.7, 6.9-6.17, 8.1-8.22, 10.9-10.12, 12.1-12.9, 23.3-23.4, 24.5-24.8 |
| Operational And UX Smells | 5.1-5.7, 8.5-8.22, 10.1-10.12, 18.1-18.5 |
| Penetration-Style Test Matrix Required | 12.1-12.9, 13.1-13.8, 14.1-14.6, 15.1-15.16, 23.3-23.4, 24.8-24.10, 24.16 |
| Uncommon Hardening Methods | 9.1-9.7, 14.1-14.6, 18.1-18.8, 19.1-19.6 |
| Documentation Bar | 2.1-2.8, 3.1-3.8, 4.1-4.6, 5.1-5.7, 6.1-6.17, 7.1-7.6, 8.9, 8.19-8.20, 10.1-10.12, 20.1-20.8, 21.1-21.10, 22.1-22.10, 23.1-23.6, 25.4-25.15, 26.1-26.25 |

## Closeout Rule

For each audit area, the final readiness report must include:

- completed task IDs;
- linked implementation commits or files;
- validation command output or artifact path;
- remaining risk, if any;
- decision: pass, defer, or accepted risk.

## 2026-07-01 Closeout Update

- Public adoption, docs conversion, documentation bar, and operational UX rows
  are backed by `evidence/docs-visual-review-2026-07-01.md`,
  `evidence/validation-run-2026-07-01.md`, and the current
  `public-adoption-readiness-report.md`.
- The visual review directly caught and closed a moved-page live viewport path
  regression in MkDocs and a missing public Zensical page copy for the
  Kubernetes service map.
- The only remaining audit closeout gate is the section 27 remote verification
  and archive path.
