## 1. Scope And Contract

- [ ] 1.1 Define Codespaces as a repo-wide development environment, not a Grafana roadmap phase
- [ ] 1.2 Document supported surfaces: MkDocs, Zensical, browser harness, synthetic Grafana, and Containerlab Grafana
- [ ] 1.3 Define tiered acceptance for bootstrap, docs, harness, synthetic Grafana, and Containerlab
- [ ] 1.4 Define security boundaries: no tokens, no automatic publishing, no public port exposure by default

## 2. Devcontainer Tooling

- [ ] 2.1 Add `.devcontainer/devcontainer.json`
- [ ] 2.2 Pin Node.js 24 LTS in the devcontainer
- [ ] 2.3 Install Python/docs dependencies required by MkDocs
- [ ] 2.4 Install Playwright browser dependencies
- [ ] 2.5 Provide Docker access for Grafana labs
- [ ] 2.6 Add optional Containerlab install or documented install hook
- [ ] 2.7 Add setup output that prints the main npm commands without starting services automatically

## 3. Docs And Harness

- [ ] 3.1 Verify `npm run docs:preview` serves MkDocs at `/topoviewer/docs/mkdocs`
- [ ] 3.2 Verify `npm run docs:preview` serves Zensical at `/topoviewer/docs/zensical`
- [ ] 3.3 Verify `npm run docs:preview` serves browser harness at `/topoviewer/harness`
- [ ] 3.4 Verify `npm run vscode:harness` works through a forwarded Vite port
- [ ] 3.5 Document Codespaces URL and forwarded-port behavior

## 4. Grafana Labs

- [ ] 4.1 Verify `npm run grafana:lab:up` works in Codespaces with mounted bundles
- [ ] 4.2 Verify `npm run grafana:lab:down` cleans up the synthetic lab
- [ ] 4.3 Add or document `npm run grafana:clab:preflight`
- [ ] 4.4 Verify `npm run grafana:clab:up` either starts the real lab or fails with a clear preflight message
- [ ] 4.5 Verify `npm run grafana:clab:down` cleans up partial or successful Containerlab startup

## 5. Documentation

- [ ] 5.1 Add a Codespaces setup page under maintainer/development docs
- [ ] 5.2 Include a quick-start path for docs and harness review
- [ ] 5.3 Include a synthetic Grafana lab path
- [ ] 5.4 Include a Containerlab support matrix and fallback path
- [ ] 5.5 Cross-link from Grafana roadmap docs without making Codespaces part of Grafana delivery

## 6. Validation

- [ ] 6.1 Run `npm ci` inside Codespaces
- [ ] 6.2 Run `npm run ci:quality` inside Codespaces
- [ ] 6.3 Run docs preview smoke inside Codespaces
- [ ] 6.4 Run browser harness smoke inside Codespaces
- [ ] 6.5 Run synthetic Grafana lab smoke inside Codespaces
- [ ] 6.6 Run Containerlab preflight inside Codespaces
- [ ] 6.7 Archive this change only after docs, harness, and synthetic Grafana pass in Codespaces and Containerlab behavior is either passing or explicitly documented as unsupported in the hosted runtime
