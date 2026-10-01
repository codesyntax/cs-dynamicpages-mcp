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

## 📚 MCP Resources

Besides tools, the server exposes read-only MCP resources, discoverable by any MCP client:

| Resource | URI | Content |
| :--- | :--- | :--- |
| Architecture | `cs-dynamicpages://docs/architecture` | Markdown reference: hierarchy, row types, common fields and migration mapping. |
| Migration protocol | `cs-dynamicpages://docs/migration` | Markdown "Skeleton + Mapping" workflow for replicating pages. |
| Row types | `cs-dynamicpages://row-types` | JSON list of available row types, from the site registry. |
| DynamicPageRow schema | `cs-dynamicpages://schemas/row` | JSON schema of `DynamicPageRow`. |
| DynamicPageRowFeatured schema | `cs-dynamicpages://schemas/row-featured` | JSON schema of `DynamicPageRowFeatured`. |

The two documentation resources work without a Plone connection. The other three require `plone_configure`; until then they return a short message explaining how to configure the connection instead of failing.

The official `@plone/mcp` resources (`plone://site`, `plone://types`, `plone://content{+path}`) remain available.

---

## ⚠️ Differences from the standalone v1 server

Earlier versions of this server shipped their own `set_session_context` / `check_credentials_status` / `create_dynamic_page_row` tools and authenticated with a `__ac` cookie. As of v2 the server delegates to `@plone/mcp`:

- Connect with `plone_configure({ baseUrl, token })` or `plone_configure({})` using `PLONE_BASE_URL` / `PLONE_TOKEN` (or username/password). The client does **not** support cookie auth; use a token or basic auth.
- Tool arguments use site-relative **paths** (e.g. `/rows`, `/en/home`). Full `++api++` URLs are also accepted and normalized to site-relative paths automatically.
- `create_content`/`search_content`/`patch_content`/`delete_content` map to `plone_create_content`/`plone_search`/`plone_update_content`/`plone_delete_content`.

---

## 💻 Installation & Usage

The server runs over STDIO (no Plone-side changes required) and can be launched either directly from the GitHub repository via `npx` or from a local clone of this repo.

### Quick Start: run via npx from GitHub (no cloning required)

Add the following configuration to your **Opencode** (`opencode.json`):

```json
{
  "mcp": {
    "cs-dynamicpages-mcp": {
      "type": "local",
      "command": ["npx", "-y", "github:codesyntax/cs-dynamicpages-mcp"],
      "enabled": true
    }
  }
}
```

`npx` fetches the repository from GitHub and launches the committed build automatically; nothing else needs to be installed. `github:` resolves to `git+ssh`, so it requires an SSH key for GitHub; without one, use the HTTPS form: `npx -y git+https://github.com/codesyntax/cs-dynamicpages-mcp.git`.

Authentication is provided through the server's `environment` block — see [Credentials & environment variables](#credentials--environment-variables). A `.env` file is not read.

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
    "cs-dynamicpages-mcp": {
      "type": "local",
      "command": ["npx", "tsx", "src/local.ts"],
      "cwd": "/absolute/path/to/cs-dynamicpages-mcp",
      "enabled": true
    }
  }
}
```

The `cwd` is required because MCP clients launch the command from an arbitrary
directory; without it the relative `src/local.ts` will not resolve. You can also
run the server directly from the clone with `npm start` (after `npm run bundle`).

### Running from a local clone without `tsx`

The compiled entry point (`dist/local.js`) is committed to the repository, so it is
available without building:

```json
{
  "mcp": {
    "cs-dynamicpages-mcp": {
      "type": "local",
      "command": ["node", "/absolute/path/to/cs-dynamicpages-mcp/dist/local.js"],
      "enabled": true
    }
  }
}
```

### Credentials & environment variables

`@plone/mcp` reads its configuration from the process environment. Supported variables:

| Variable | Description |
| :--- | :--- |
| `PLONE_BASE_URL` | Base URL of your Plone site (fallback for `plone_configure`). |
| `PLONE_TOKEN` | Bearer token for authentication (alternative to username/password). |
| `PLONE_USERNAME` / `PLONE_PASSWORD` | Basic auth credentials. |
| `ENABLED_TOOLS` | Optional comma-separated allow-list of tool names; applies to both the official tools and the dynamic pages tools. |
| `PLONE_SESSION_TTL` | Session TTL in milliseconds (from `@plone/mcp`). |
| `PLONE_PREPARED_BLOCKS_TTL` | Prepared-blocks TTL in milliseconds (from `@plone/mcp`). |

Provide them through the MCP server's `environment` block in `opencode.json`:

```json
{
  "mcp": {
    "cs-dynamicpages-mcp": {
      "type": "local",
      "command": ["npx", "-y", "github:codesyntax/cs-dynamicpages-mcp"],
      "environment": {
        "PLONE_BASE_URL": "https://your-plone",
        "PLONE_TOKEN": "eyJhbGciOi..."
      },
      "enabled": true,
      "timeout": 60000
    }
  }
}
```

Or with basic auth instead of a token:

```json
"environment": {
  "PLONE_BASE_URL": "https://your-plone",
  "PLONE_USERNAME": "admin",
  "PLONE_PASSWORD": "secret"
}
```

Then call `plone_configure({})` once per session. The credentials live in the server process environment; the model never needs to read them.

> ⚠️ **A `.env` file is not loaded into the MCP server.** Verified with OpenCode: with a variable defined only in `.env`, the server process received `undefined`, and `{env:VAR}` resolved to an empty string (OpenCode runs a long-lived background service, so the MCP process inherits the service environment, not the environment of the shell that runs a single command).

If you prefer not to store secrets in `opencode.json`, use substitution (`"PLONE_TOKEN": "{env:PLONE_TOKEN}"`) and make sure the variable is present in the environment that starts the OpenCode **service** (then restart it, e.g. `opencode service restart`). Exporting it only in the shell of a one-off command does not reach the server.

*Note: credentials can also be passed at runtime with `plone_configure({ baseUrl, token })` (or username/password).*

Requires a Node.js version supported by `@plone/mcp`: `^20.19.0 || >=22.12.0` (Node.js 22+ recommended).

---

## 🏗️ Project Structure

*   **`src/local.ts`**: Entry point for local `stdio` execution (the extended server).
*   **`src/extended-server.ts`**: Creates the `@plone/mcp` server and registers the dynamic pages tools.
*   **`src/plone-mcp.ts`**: Single adapter re-exporting the `@plone/mcp` internals the wrapper relies on.
*   **`src/tools/`**: One file per dynamic pages tool (`plone_*.ts`), plus `shared.ts` (helpers and schemas) and `index.ts` (the `dynamicPagesTools` list and `registerDynamicPagesTools`), mirroring the `@plone/mcp` layout.
*   **`src/dynamicPages/`**: Pure helpers (payload builders, ordering computation, hierarchy reassembly) shared by the tools.
*   **`scripts/build.mjs`**: esbuild bundling of `src/local.ts` into `dist/local.js`.

---

## 🧪 Development

```bash
npm install       # .npmrc sets legacy-peer-deps for npm 10 + vitest
npm run bundle    # rebuild dist/local.js (esbuild) — run before committing
npm test          # vitest unit + handler seam tests
npm run typecheck # tsc --noEmit
npm start         # run the compiled stdio server (node dist/local.js)
npm run dev       # run from source with tsx (src/local.ts)
```

`dist/local.js` is intentionally committed: git installs (`npx github:…`) must not
run a build, because that would install devDependencies and npm 10.9.x crashes on
vitest's peer set. Remember to run `npm run bundle` and commit `dist/` after
changing the source.

> The build script is named `bundle` (not `build`) on purpose: npm/pacote treat a
> `build` script as a git-dependency preparation trigger, which would reinstall
> devDependencies on `npx github:…`.

This project pins `@plone/mcp` to the published `1.0.0-alpha.2` package. To track
unreleased changes from the official repository instead, point the dependency at
the branch (`git+https://github.com/plone/plone-mcp.git#main`). Note that a git
dependency requires **npm >= 11** (or `legacy-peer-deps` on npm 10), because
`@plone/mcp` compiles itself on install.

---

## 🔒 Security

This server handles credentials strictly within your local environment. The `@plone/mcp` code runs from `node_modules` on your machine, and your API tokens are only ever sent to the Plone site you configure. Ensure you trust the source before providing sensitive API tokens.
