# Plone Dynamic Pages MCP Server

A specialized Model Context Protocol (MCP) server for managing Plone sites built with the `cs_dynamicpages` architecture. This server allows LLMs to inspect, create, and manage complex page layouts directly.

## 🚀 Key Features

*   **Session-Aware & Contextual**: Use `set_session_context` to set credentials once and forget them for the rest of the session.
*   **Dynamic Layout Management**: Analyze full page structures, including rows and featured items.
*   **Full CRUD Operations**: Create, patch, move, and delete Plone content and layout components.
*   **Universal Content Support**: Generic `create_content` tool for any Plone content type (Folder, Document, Link, etc.).
*   **Local File Integration**: `upload_local_asset` allows direct upload of files from your filesystem.

---

## 🛠️ Tools Provided

| Tool | Description |
| :--- | :--- |
| `check_credentials_status` | Verifies if Plone credentials (token or cookie) are provided. |
| `set_session_context` | Sets the default site URL and credentials for the current session. |
| `get_site_definitions` | Fetches site-specific definitions (Schemas and Row Types) from Plone. |
| `get_dynamic_page_content` | Returns the full JSON structure of a DynamicPage (Rows + Featured Items). |
| `create_content` | Creates any content type in Plone (Folder, Document, Link, etc.). |
| `create_dynamic_page_row` | Creates a new layout section (`DynamicPageRow`) in a page. |
| `create_dynamic_page_row_featured` | Creates a featured item (`DynamicPageRowFeatured`) within an existing row. |
| `search_content` | Searches for content, assets, or pages within the Plone site. |
| `patch_content` | Updates an existing Plone object (PATCH). |
| `delete_content` | Deletes a Plone object (requires confirmation). |
| `move_dynamic_page_row` | Reorders layout rows (top, bottom, or specific position). |
| `upload_file` | Uploads images or files using Base64 data. |
| `upload_local_asset` | Reads a file from the local filesystem and uploads it to Plone. |

---

## 💻 Installation & Usage

This server is designed to be run without manual installation or cloning, using **`npx`**.

### Quick Start (Recommended)

Add the following configuration to your **Opencode** (`opencode.json`):

```json
{
  "mcp": {
    "cs-dynamicpages": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "github:codesyntax/cs-dynamicpages-mcp"
      ],
      "enabled": true
    }
  }
}
```

### Environment Variables

*   `PLONE_API_URL`: The base URL of your Plone REST API.
*   `PLONE_TOKEN`: Bearer token for authentication.
*   `PLONE_COOKIE`: Session cookie (`__ac`) for authentication.

*Note: You can also set these dynamically during a session using the `set_session_context` tool.*

---

## 🏗️ Project Structure

*   **`src/local.ts`**: Entry point for local `stdio` execution.
*   **`src/server.ts`**: Core MCP server logic and tool definitions.
*   **`src/tools/`**: Modular implementations of Plone API interactions.
*   **`src/utils.ts`**: Helper functions for URL normalization and headers.

---

## 🔒 Security

This server handles credentials strictly within your local environment. When running via `npx`, the code is fetched from GitHub and executed on your machine. Ensure you trust the source before providing sensitive API tokens.
