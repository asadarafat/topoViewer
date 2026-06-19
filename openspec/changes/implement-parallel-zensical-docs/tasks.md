## 1. Planning And Source Setup

- [x] 1.1 Move the feasibility study into this change as historical context
- [x] 1.2 Confirm the current Zensical install, build, serve, and config syntax
- [x] 1.3 Decide the public Zensical path, defaulting to `/topoViewer/zensical/`
- [x] 1.4 Add `docs-zensical/` and `zensical.toml`

## 2. Zensical Embed Assets

- [x] 2.1 Add `topoviewer-zensical.js` adapter that mounts on initial load and `document$`
- [x] 2.2 Add optional `topoviewer-zensical.css` for Zensical-specific theme polish
- [x] 2.3 Add `sync:zensical-assets` script for embed CSS and IIFE bundle
- [x] 2.4 Ensure copied embed assets are regenerated from `packages/topoviewer/dist/embed/`

## 3. Zensical Content

- [x] 3.1 Add a Zensical landing page that frames the site as a parallel preview
- [x] 3.2 Add a Zensical TopoViewer embed example page
- [x] 3.3 Add topology and stylesheet YAML under the Zensical docs tree
- [x] 3.4 Keep the Zensical example small and readable
- [x] 3.5 Add `sync:zensical-docs` to generate mirrored TopoViewer pages from `docs/topoviewer`
- [x] 3.6 Rewrite MkDocs `topoviewer` fences into static Zensical embed HTML
- [x] 3.7 Expand snippet directives in generated Zensical pages
- [x] 3.8 Copy `docs/topoviewer/examples/**` into Zensical example assets
- [x] 3.9 Generate Zensical nav from the MkDocs nav subset

## 4. Local Commands

- [x] 4.1 Add `npm run zensical:build`
- [x] 4.2 Add `npm run zensical:serve`
- [x] 4.3 Add `npm run docs:build:parallel` to build MkDocs and Zensical into one output tree
- [x] 4.4 Document local preview URLs for MkDocs and Zensical

## 5. GitHub Actions

- [x] 5.1 Install Zensical in `.github/workflows/ci.yml`
- [x] 5.2 Build and validate Zensical in CI
- [x] 5.3 Install Zensical in `.github/workflows/docs.yml`
- [x] 5.4 Build MkDocs to `site/` and Zensical to `site/zensical/`
- [x] 5.5 Upload the combined `site/` artifact to GitHub Pages

## 6. Validation

- [x] 6.1 Add a script or test that checks built Zensical output for required assets
- [x] 6.2 Run `npm run zensical:build`
- [x] 6.3 Run `npm run docs:build:parallel`
- [x] 6.4 Run `npm run ci`
- [x] 6.5 Manually verify local Zensical preview renders the TopoViewer embed
- [x] 6.6 Verify mirrored Zensical TopoViewer pages render live examples locally
- [ ] 6.7 Verify remote GitHub Pages exposes both `/topoViewer/` and `/topoViewer/zensical/`
