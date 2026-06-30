## Spec Traceability

This file maps every requirement in
`specs/public-adoption-readiness/spec.md` to concrete implementation tasks in
`tasks.md`.

This is the closeout source of truth. The change should not be archived when
the audit feels addressed; it should be archived only when every spec
requirement is implemented, validated, explicitly deferred to a named follow-up
OpenSpec, or accepted with a named risk owner.

| Spec requirement | Scenarios covered | Required task IDs |
| --- | --- | --- |
| Public Entry Point Clarity | First screen explains the product; stable path is separated from roadmap | 2.1-2.8, 3.1-3.8, 4.1-4.6, 5.1-5.7, 18.1 |
| React Flow-Style Documentation Information Architecture | User follows a learning path; user needs exact API or schema details; user browses examples and showcase separately; lab and roadmap content stays honest | 2.9-2.17, 6.1-6.18, 24.2 |
| Support Status Taxonomy | Integration status is visible; roadmap does not imply support | 1.8, 4.1-4.6, 11.5-11.7, 19.2 |
| Curated Example Path | User wants copyable network example; generated catalog remains available | 5.1-5.7, 9.1-9.7, 24.3 |
| Promotional Walkthrough Video | Video generated repeatably; video tells YAML-to-graph story; README uses durable hosted asset | 17.1-17.11, 14.4, 24.11, 24.19 |
| Stable Contract Visibility | User checks YAML field; user checks exported API | 4.5, 6.2-6.18, 8.2-8.4, 15.5, 21.1-21.10, 24.2, 24.12 |
| TopoViewer Object Attribute Reference | Developer checks topology object attribute; developer learns by example; reference stays aligned | 6.9-6.17, 8.19-8.20, 10.10, 21.3-21.5, 24.2, 24.5 |
| Enterprise Trust And Governance | Project ownership; support boundaries; vulnerability reporting | 20.1-20.8, 24.14 |
| Compatibility And API Stability | Existing YAML remains compatible; public API changes controlled; compatibility matrix visible | 21.1-21.10, 24.12 |
| Performance And Reliability Evidence | Graph size limits; performance budget regressions; runtime failure diagnostics | 22.1-22.6, 24.13 |
| Accessibility And UI Integration Contract | Keyboard navigation; accessible visual state | 22.7-22.9, 24.13 |
| Architecture And Threat Model | Architecture review; threat model review | 23.1-23.6, 24.15 |
| Harness Mapper Authoring | Complete Grafana bundle; creates mapper without source knowledge; schema/topology-aware suggestions; actionable validation; mapping coverage preview; object/attribute examples | 8.1-8.22, 10.1-10.3, 10.9-10.12, 24.4, 24.6 |
| Manual npm Publishing | Push validates but does not publish; maintainer publishes intentionally; install instructions match package; early release dist-tag | 15.5, 15.7, 16.1-16.8, 24.7 |
| Cross-Surface Early-Adopter Ergonomics | User starts from YAML; integration page gives exact expectations; Grafana user brings own bundle | 2.1-2.8, 3.1-3.8, 4.1-4.6, 6.9-6.17, 8.1-8.22, 10.1-10.12, 18.1-18.4 |
| Security And Abuse Resistance | Hostile visual content inert; hostile YAML fails safely; Grafana mounted bundle cannot escape root; Grafana roles are tested | 12.1-12.9, 13.1-13.8, 23.3-23.4, 24.8 |
| Lab Safety Boundaries | User starts a lab; user reads production guidance | 1.5, 10.1-10.8, 11.1-11.7, 15.6 |
| Artifact And Supply-Chain Integrity | npm package prepared; Grafana plugin artifact prepared; dependency advisories exist | 14.1-14.6, 15.1-15.16, 16.1-16.8, 24.7, 24.9, 24.10, 24.16 |
| Automated Security Monitoring | Dependency updates automatic; static and secret scanning; lab/plugin image scanning; security automation health visible | 15.8-15.16, 19.2-19.5, 24.16 |
| Uncommon Hardening Program | Fake early adopter follows docs only; public artifacts autopsied; cross-surface visual parity protected | 9.1-9.7, 14.1-14.6, 18.1-18.8, 19.1-19.6, 24.9 |
| Differentiation Without Hype | Mermaid.js comparison; React Flow comparison | 7.1-7.6, 3.1, 4.4 |
| Public Docs Quality Gates | Public nav regresses; representative examples regress visually | 2.7-2.8, 9.1-9.7, 11.1-11.7, 19.2-19.5, 24.2-24.3 |

## Scenario-Level Closeout Evidence

For each spec scenario, the final readiness report must include:

- completed task IDs;
- implementation file links;
- validation command output or artifact paths;
- screenshots or generated reports when the scenario is visual;
- risk decision: pass, defer to named OpenSpec, or accepted risk with owner.
