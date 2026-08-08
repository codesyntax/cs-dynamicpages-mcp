import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const DYNAMIC_TOOLS = [
  "plone_get_site_definitions",
  "plone_get_dynamic_page_content",
  "plone_create_dynamic_page_row",
  "plone_create_dynamic_page_row_featured",
  "plone_move_dynamic_page_row",
  "plone_upload_file",
  "plone_upload_local_asset",
];

const LEGACY_TOOLS = [
  "set_session_context",
  "check_credentials_status",
  "get_site_definitions",
  "create_content",
  "search_content",
  "patch_content",
  "delete_content",
];

const OFFICIAL_TOOLS = [
  "plone_configure",
  "plone_create_content",
  "plone_search",
  "plone_get_navigation_tree",
];

const CWD = new URL("../..", import.meta.url).pathname;

describe("extended server over stdio", () => {
  it(
    "lists the official tools plus the seven dynamic pages tools, without the legacy tools",
    async () => {
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "src/local.ts"],
        cwd: CWD,
      });
      const client = new Client({ name: "integration-smoke", version: "0.0.1" });
      await client.connect(transport);
      try {
        const { tools } = await client.listTools();
        const names = tools.map((t) => t.name);

        for (const name of DYNAMIC_TOOLS) {
          expect(names).toContain(name);
        }
        for (const name of OFFICIAL_TOOLS) {
          expect(names).toContain(name);
        }
        for (const name of LEGACY_TOOLS) {
          expect(names).not.toContain(name);
        }
      } finally {
        await client.close();
      }
    },
    60000,
  );
});