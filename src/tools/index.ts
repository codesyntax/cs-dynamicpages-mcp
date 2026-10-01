import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ploneCreateDynamicPageRow } from "./plone_create_dynamic_page_row";
import { ploneCreateDynamicPageRowFeatured } from "./plone_create_dynamic_page_row_featured";
import { ploneGetDynamicPageContent } from "./plone_get_dynamic_page_content";
import { ploneGetSiteDefinitions } from "./plone_get_site_definitions";
import { ploneMoveDynamicPageRow } from "./plone_move_dynamic_page_row";
import { ploneUploadFile } from "./plone_upload_file";
import { ploneUploadLocalAsset } from "./plone_upload_local_asset";
import type { ToolDefinition } from "./shared";

export const dynamicPagesTools: ToolDefinition[] = [
  ploneGetSiteDefinitions,
  ploneGetDynamicPageContent,
  ploneCreateDynamicPageRow,
  ploneCreateDynamicPageRowFeatured,
  ploneMoveDynamicPageRow,
  ploneUploadFile,
  ploneUploadLocalAsset,
];

export function registerDynamicPagesTools(server: McpServer) {
  // Mirror the official @plone/mcp behaviour: ENABLED_TOOLS may restrict the
  // registered tools. When unset, every dynamic pages tool is registered.
  const enabledToolsEnv = process.env.ENABLED_TOOLS;
  const enabledTools = enabledToolsEnv
    ? new Set(enabledToolsEnv.split(",").map((t) => t.trim()))
    : null;

  for (const tool of dynamicPagesTools) {
    if (enabledTools && !enabledTools.has(tool.name)) continue;
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      tool.handler,
    );
  }
}
