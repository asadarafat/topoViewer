## Phase 6: Codespaces Portability

### Goal

Only investigate Codespaces after the local Grafana/Prometheus/Containerlab lab
works repeatably.

### Preconditions

- Phase 1 panel parity passes locally.
- Phase 2 Prometheus weathermap passes locally.
- Phase 3 interaction state has stable refresh behavior.
- Local lab commands have deterministic setup and teardown.

### Questions

- Can Containerlab run with the required privileges?
- Do nested networking constraints block the topology?
- Do required images pull within acceptable time?
- Does port forwarding expose Grafana, Prometheus, and the injector reliably?
- Can workspace storage preserve generated data and dashboards?
- Do Codespaces resources handle the target topology size?
- Can docs explain URLs without hard-coded workspace IDs?

### Acceptance

- A Codespaces feasibility note answers each question.
- A Codespaces demo is not published unless local parity and weathermap tests
  already pass.
- Public docs keep Codespaces marked experimental until the workflow is proven.
