# 1. Spec

- [x] 1.1 Capture lowercase repository and Pages URL contract
- [x] 1.2 Capture combined MkDocs/Zensical/harness Pages layout
- [x] 1.3 Capture single-port local preview behavior

# 2. Build Layout

- [x] 2.1 Change MkDocs output to `site/docs/mkdocs`
- [x] 2.2 Change Zensical output to `site/docs/zensical`
- [x] 2.3 Change harness output and base URL to `site/harness` and `/topoviewer/harness/`
- [x] 2.4 Add redirect entry points for `/topoviewer/` and `/topoviewer/docs/`
- [x] 2.5 Update build validation scripts for the new physical paths

# 3. Local Preview

- [x] 3.1 Add a shared static Pages server helper
- [x] 3.2 Update docs smoke to use `/topoviewer/docs/mkdocs`, `/topoviewer/docs/zensical`, and `/topoviewer/harness`
- [x] 3.3 Update `npm run docs:preview` to build and serve the combined artifact on port 8001
- [x] 3.4 Remove the separate 8002 Zensical requirement from the main preview command

# 4. Public Links

- [x] 4.1 Update README generation for lowercase GitHub and Pages URLs
- [x] 4.2 Update package metadata and VS Code docs URL
- [x] 4.3 Update canonical docs content that mentions preview or Pages paths
- [x] 4.4 Regenerate README and docs projections

# 5. Validation

- [x] 5.1 Run `npm run sync:docs`
- [x] 5.2 Run `npm run docs:build:parallel`
- [x] 5.3 Run `npm run docs:smoke`
- [x] 5.4 Run `npm run ci:quality`
- [x] 5.5 Run `git diff --check`
