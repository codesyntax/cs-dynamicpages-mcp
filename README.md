# Plone Dynamic Pages MCP Server

An MCP server that **extends the official [`@plone/mcp`](https://github.com/plone/plone-mcp) server** with seven additional tools for managing Plone sites built with the [cs_dynamicpages](https://github.com/codesyntax/cs_dynamicpages) product. Call `plone_configure` once per session, then use the full official toolset plus the dynamic-layout tools.

## 🚀 Key Features

*   **Official toolset included**: All `@plone/mcp` tools (blocks, workflow, translations, users, navigation tree, vocabularies, search) are available as-is.
*   **Dynamic Layout Management**: Analyze full page structures, including rows and featured items.
*   **Full CRUD Operations**: Create, patch, move, and delete Plone content and layout components.
*   **Universal Content Support**: Generic `plone_create_content` tool for any Plone content type (Folder, Document, Link, etc.).
*   **Local File Integration**: `plone_upload_local_asset` uploads files straight from your filesystem.

---

## 🛠️ Dynamic Pages Tools (added on top of `@plone/mcp`)

| Tool | Description |
| :--- | :--- |
| `plone_get_site_definitions` | Fetches site-specific definitions (Schemas and Row Types) from Plone. |
| `plone_get_dynamic_page_content` | Returns the full JSON structure of a DynamicPage (Rows + Featured Items). Handles up to 1000 items. |
| `plone_create_dynamic_page_row` | Creates a new layout section (`DynamicPageRow`) in a page, optionally with nested featured items. |
| `plone_create_dynamic_page_row_featured` | Creates a featured item (`DynamicPageRowFeatured`) within an existing row. |
| `plone_move_dynamic_page_row` | Reorders layout rows (top, bottom, or a specific position). |
| `plone_upload_file` | Uploads images or files using Base64 data. |
| `plone_upload_local_asset` | Reads a file from the local filesystem and uploads it to Plone. |

Everything else comes from the official package: `plone_configure`, `plone_create_content`, `plone_update_content`, `plone_delete_content`, `plone_search`, `plone_get_navigation_tree`, `plone_get_block_schemas`, workflow and translations tools, etc.

---

## ⚠️ Differences from the standalone v1 server

Earlier versions of this server shipped their own `set_session_context` / `check_credentials_status` / `create_dynamic_page_row` tools and authenticated with a `__ac` cookie. As of v2 the server delegates to `@plone/mcp`:

- Connect with `plone_configure({ baseUrl, token })` or `plone_configure({})` using `PLONE_BASE_URL` / `PLONE_TOKEN` (or username/password). The client does **not** support cookie auth; use a token or basic auth.
- Tool arguments use site-relative **paths** (e.g. `/rows`, `/en/home`), not full `++api++` URLs.
- `create_content`/`search_content`/`patch_content`/`delete_content` map to `plone_create_content`/`plone_search`/`plone_update_content`/`plone_delete_content`.

---

## 💻 Installation & Usage

The server runs over STDIO (no Plone-side changes required) and can be launched either directly from the GitHub repository via `npx` or from a local clone of this repo.

### Quick Start: run via npx from GitHub (no cloning required)

Add the following configuration to your **Opencode** (`opencode.json`):

```json
{
  "mcp": {
    "cs-dynamicpages": {
      "type": "local",
      "command": ["npx", "-y", "github:codesyntax/cs-dynamicpages-mcp"],
      "enabled": true
    }
  }
}
```

`npx` fetches the repository from GitHub and launches the server automatically; nothing else needs to be installed.

### Running from a local clone

Clone the repository and install its dependencies:

```bash
git clone https://github.com/codesyntax/cs-dynamicpages-mcp
cd cs-dynamicpages-mcp
npm install
```

Then point your MCP client at the local entry point instead of the GitHub package:

```json
{
  "mcp": {
    "cs-dynamicpages": {
      "type": "local",
      "command": ["npx", "tsx", "src/local.ts"],
      "enabled": true
    }
  }
}
```

or simply run it directly with `npm start`.

### Environment Variables

*   `PLONE_BASE_URL`: The base URL of your Plone site (used by `plone_configure` as a fallback).
*   `PLONE_TOKEN`: Bearer token for authentication.
*   `PLONE_USERNAME` / `PLONE_PASSWORD`: Basic auth credentials.

*Note: You can also set these dynamically during a session with the `plone_configure` tool.*

Requires **Node.js 22+** (the same requirement as `@plone/mcp`).

---

## 🏗️ Project Structure

*   **`src/local.ts`**: Entry point for local `stdio` execution (the extended server).
*   **`src/extended-server.ts`**: Creates the `@plone/mcp` server and registers the dynamic pages tools.
*   **`src/tools/registerDynamicPagesTools.ts`**: The seven dynamic pages tools and their registration.
*   **`src/dynamicPages/`**: Pure helpers (payload builders, ordering computation, hierarchy reassembly) shared by the tools.

---

## 🧪 Development

```bash
npm install
npm test          # vitest unit + handler seam tests
npm run typecheck # tsc --noEmit
npm start         # run the stdio server directly
```

This project pins `@plone/mcp` to the released `1.0.0-alpha.1` package; bump it in `package.json` to pick up newer releases.

---

## 🔒 Security

This server handles credentials strictly within your local environment. The `@plone/mcp` code runs from `node_modules` on your machine, and your API tokens are only ever sent to the Plone site you configure. Ensure you trust the source before providing sensitive API tokens.
