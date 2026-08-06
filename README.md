# Plone Dynamic Pages MCP Server

A specialized Model Context Protocol (MCP) server for managing Plone sites built with the `cs_dynamicpages` architecture. This server allows LLMs to inspect, create, and manage complex page layouts directly.

## 🚀 Key Features

*   **Stateless & Site-Agnostic**: Works with any Plone site. Credentials and API URLs are provided per session or via environment variables.
*   **Dynamic Layout Management**: Analyze full page structures, including rows and featured items.
*   **Full CRUD Operations**: Create, patch, move, and delete Plone content and layout components.
*   **Local Execution**: Designed to run as a local process via `stdio`, ensuring stability and performance.

---

## 🛠️ Tools Provided

| Tool | Description |
| :--- | :--- |
| `check_credentials_status` | Verifies if Plone credentials (token or cookie) are provided. |
| `get_site_definitions` | Fetches site-specific definitions (Schemas and Row Types) from Plone. |
| `get_dynamic_page_content` | Returns the full JSON structure of a DynamicPage (Rows + Featured Items). |
| `create_dynamic_page_row` | Creates a new layout section (`DynamicPageRow`) in a page. |
| `search_content` | Searches for content, assets, or pages within the Plone site. |
| `patch_content` | Updates an existing Plone object (PATCH). |
| `delete_content` | Deletes a Plone object (requires confirmation). |
| `move_dynamic_page_row` | Reorders layout rows (top, bottom, or specific position). |
| `upload_file` | Uploads images or files directly to Plone. |

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

*   `PLONE_API_URL`: The base URL of your Plone REST API (optional if provided in tool calls).
*   `PLONE_TOKEN`: Bearer token for authentication.
*   `PLONE_COOKIE`: Session cookie (`__ac`) for authentication (alternative to token).

---

## 🏗️ Project Structure

*   **`src/local.ts`**: Entry point for local `stdio` execution.
*   **`src/server.ts`**: Core MCP server logic and tool definitions.
*   **`src/tools/`**: Modular implementations of Plone API interactions.
*   **`src/utils.ts`**: Helper functions for URL normalization and headers.

---

## 🔒 Security

This server handles credentials strictly within your local environment. When running via `npx`, the code is fetched from GitHub and executed on your machine. Ensure you trust the source before providing sensitive API tokens.
