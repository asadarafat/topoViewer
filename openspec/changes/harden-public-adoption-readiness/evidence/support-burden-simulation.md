# Support-Burden Simulation

These are the first issues early adopters are likely to open. The top ten have
prevention work linked to docs, checks, or remaining tasks.

| Rank | Likely issue | Prevention or owner |
|---:|---|---|
| 1 | `npm install topoviewer` returns 404 | README/React pages label package as pre-publish until manual npm publish. |
| 2 | Docs URL casing breaks after repo rename | Public-readiness checks reject stale `/TopoViewer/` and wrong repo casing. |
| 3 | MkDocs and Zensical render differently from harness | Render parity tasks and `ci:render-parity`; still open for broader fixture coverage. |
| 4 | Mapper YAML is hard to author | Harness mapper editor exists; rule-builder and coverage preview remain open in task 8. |
| 5 | Grafana user edits fixture catalog instead of mounting bundle | Grafana docs demote fixture mode and document mounted bundles. |
| 6 | Prometheus labels do not match TopoViewer IDs | Grafana mapper docs explain target kinds, resolvers, labels, data, and coverage. |
| 7 | Diagram freezes with huge YAML | Renderer limits and reliability docs; additional YAML abuse tests remain open in task 12. |
| 8 | SVG icon executes or breaks page | Hostile SVG corpus and sanitizer tests exist; docs/Grafana hostile tests remain open. |
| 9 | Link arrows/labels look different in docs | Directional link docs and render parity tasks own this. |
| 10 | User cannot tell what is supported | Support status taxonomy and lint checks enforce status labels. |
| 11 | Browser harness state persists unexpected old YAML | Harness apply/revert/local persistence docs and tests. |
| 12 | Grafana dashboard cannot be saved | Grafana docs explain provisioning versus editable dashboards. |
| 13 | Containerlab lab is mistaken for production deployment | Lab safety docs and warnings keep Containerlab under Grafana lab mode. |
| 14 | New style key missing from docs/YAML assist | Generated object reference and style metadata checks. |
| 15 | Old YAML breaks silently | Compatibility fixtures and migration diagnostics. |
| 16 | Security scanner reports dependency risk | Dependency-risk ledger and security workflow triage policy. |
| 17 | User asks for VS Code extension production support | Status label remains Experimental. |
| 18 | NetBox/OpsMill user expects shipped plugin | Integration roadmap labels these Roadmap. |
| 19 | README animated media missing | Accepted: README favors the checked-in collage; generated video/GIF/MP4 remains local-only review media. |
| 20 | Accessibility expectations are unclear | Performance/reliability/accessibility docs state current posture and gaps. |

Top remaining support reducers:

1. Finish mapper rule-builder and coverage preview.
2. Add curated visual evidence across harness, MkDocs, and Zensical.
3. Keep the README collage polished and add curated visual evidence across surfaces.
4. Expand hostile-content tests into docs embeds and Grafana.
5. Add automated accessibility checks.
