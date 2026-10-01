# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `plone_get_site_definitions` tool to fetch site-specific schemas and row types.
- `plone_get_dynamic_page_content` tool returning the full JSON hierarchy of a page (rows + featured items, up to 1000 items).
- `plone_create_dynamic_page_row` tool to create a row, optionally with nested featured items in one call.
- `plone_create_dynamic_page_row_featured` tool to add a featured item to an existing row.
- `plone_move_dynamic_page_row` tool to reorder rows (top, bottom, or a specific position).
- `plone_upload_file` and `plone_upload_local_asset` tools to upload files (base64 or from the local filesystem).
- Vitest unit + handler seam tests, `tsconfig.json`, and `typecheck`/`test`/`bundle` npm scripts.
- Contract test guarding the `@plone/mcp` surface the wrapper depends on (`__tests__/unit/ploneMcpContract.test.ts`).
- esbuild pipeline (`scripts/build.mjs`) producing a single, committed `dist/local.js` entry point.

### Changed

- The server now **extends the official `@plone/mcp` toolset** instead of implementing standalone tools; `plone_configure` and the full official toolset (blocks, workflow, translations, users, navigation tree, vocabularies, search) are available.
- `@plone/mcp` is pinned to the published `1.0.0-alpha.2` package. (To track unreleased changes, the dependency can be pointed at `git+https://github.com/plone/plone-mcp.git#main`; note that git installs require npm >= 11 because `@plone/mcp` compiles itself on install.)
- All contact with `@plone/mcp` internals goes through a single adapter, `src/plone-mcp.ts`.
- `main`/`bin` now point to the compiled and committed `dist/local.js`, so `tsx` is only needed for development (`npm run dev`). There is no `build`/`prepare` script, so git installs (`npx github:…`) do not install devDependencies (which crashes npm 10.9.x on vitest's peer set). Rebuild with `npm run bundle` before committing source changes.
- The dynamic pages tools honour `ENABLED_TOOLS`, mirroring the official toolset.
- Path arguments are normalized to site-relative paths (full `++api++` URLs are converted automatically).
- README install docs: primary option runs via `npx github:codesyntax/cs-dynamicpages-mcp`, with an alternative section for running from a local clone.
- The dynamic pages tools live in one file per tool under `src/tools/` (plus `shared.ts` and `index.ts`), mirroring the `@plone/mcp` layout.

### Fixed

- `plone_get_dynamic_page_content` returned no rows: comma-separated `portal_type` values are not supported by plone.restapi, and axios array encoding is ignored. It now sends repeated `portal_type` query parameters.
- `plone_move_dynamic_page_row` computed an off-by-one `delta` for numeric positions and only read the first 25 rows of the folder; it now emits the correct relative delta and requests `b_size=1000`.
- `reassembleDynamicContent` could attach rows from sibling folders whose id only shared a prefix (e.g. `rows-extra` next to `rows`).
- Custom `fields` could override the controlled `@type`/`title`/`row_type` keys in row and featured payloads.
- `rowShortName` now normalizes site-relative paths (`/rows/row-a`), not just full URLs.
- Corrected the misleading `row_type` example in the tool schema.

### Removed

- Standalone v1 server (`src/server.ts`, `src/tools/`, `src/types.ts`, `src/utils.ts`) and its tools (`set_session_context`, `check_credentials_status`, `create_dynamic_page_row`, `search_content`, `patch_content`, `delete_content`, `move_dynamic_page_row`, `upload_file`, `upload_local_asset`).
- Cookie (`__ac`) authentication support; the `@plone/mcp` client authenticates with a token or basic auth.
