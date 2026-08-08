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
- Vitest unit + handler seam tests, `tsconfig.json`, and `typecheck`/`test`/`build` npm scripts.

### Changed

- The server now **extends the official `@plone/mcp` toolset** (`@plone/mcp` `1.0.0-alpha.1`) instead of implementing standalone tools; `plone_configure` and the full official toolset (blocks, workflow, translations, users, navigation tree, vocabularies, search) are available.
- Path arguments are normalized to site-relative paths (full `++api++` URLs are converted automatically).
- README install docs: primary option runs via `npx github:codesyntax/cs-dynamicpages-mcp`, with an alternative section for running from a local clone.

### Removed

- Standalone v1 server (`src/server.ts`, `src/tools/`, `src/types.ts`, `src/utils.ts`) and its tools (`set_session_context`, `check_credentials_status`, `create_dynamic_page_row`, `search_content`, `patch_content`, `delete_content`, `move_dynamic_page_row`, `upload_file`, `upload_local_asset`).
- Cookie (`__ac`) authentication support; the `@plone/mcp` client authenticates with a token or basic auth.
