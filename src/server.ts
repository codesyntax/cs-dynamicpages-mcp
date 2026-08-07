import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { PloneCredentials } from "./types";

// Import tools
import { getSiteDefinitions } from "./tools/getSiteDefinitions";
import { getDynamicPageContent } from "./tools/getDynamicPageContent";
import { createRow, createFeatured } from "./tools/createRow";
import { createContent } from "./tools/createContent";
import { searchContent } from "./tools/searchContent";
import { patchContent } from "./tools/patchContent";
import { deleteContent } from "./tools/deleteContent";
import { moveRow } from "./tools/moveRow";
import { uploadAsset } from "./tools/uploadAsset";
import { uploadLocalAsset } from "./tools/uploadLocalAsset";

export function createMcpServer() {
  const server = new Server(
    { name: "cs-dynamicpages-mcp", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );

  let sessionContext: PloneCredentials = {
    api_url: "",
    token: "",
    cookie: ""
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        { name: "check_credentials_status", description: "Checks if Plone credentials (token or cookie) are provided in the arguments.", inputSchema: { type: "object", properties: { token: { type: "string" }, cookie: { type: "string" } } } },
        { name: "set_session_context", description: "Sets the default site URL and credentials for the current session.", inputSchema: { type: "object", properties: { api_url: { type: "string" }, token: { type: "string" }, cookie: { type: "string" } } } },
        { name: "get_site_definitions", description: "Fetches site-specific definitions (Schemas and Row Types) from Plone.", inputSchema: { type: "object", properties: { api_url: { type: "string" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["api_url"] } },
        { name: "get_dynamic_page_content", description: "Fetches the full JSON structure of a DynamicPage including rows and featured items.", inputSchema: { type: "object", properties: { page_url: { type: "string" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["page_url"] } },
        { name: "create_content", description: "Creates any content type in Plone.", inputSchema: { type: "object", properties: { api_url: { type: "string" }, content_type: { type: "string" }, data: { type: "object" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["content_type", "data"] } },
        { name: "create_dynamic_page_row", description: "Creates a DynamicPageRow in Plone.", inputSchema: { type: "object", properties: { api_url: { type: "string", description: "URL of the rows folder" }, row_data: { type: "object" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["api_url", "row_data"] } },
        { name: "create_dynamic_page_row_featured", description: "Creates a DynamicPageRowFeatured in Plone.", inputSchema: { type: "object", properties: { api_url: { type: "string", description: "URL of the parent row" }, feat_data: { type: "object" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["api_url", "feat_data"] } },
        { name: "search_content", description: "Searches for content in the Plone site.", inputSchema: { type: "object", properties: { api_url: { type: "string" }, query: { type: "string" }, portal_type: { type: "string" }, path: { type: "string" }, limit: { type: "number", description: "Maximum number of results to return (default: 100)" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["api_url"] } },
        { name: "patch_content", description: "Updates an existing Plone object (PATCH).", inputSchema: { type: "object", properties: { content_url: { type: "string" }, data: { type: "object" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["content_url", "data"] } },
        { name: "delete_content", description: "Deletes a Plone object. Confirmation required.", inputSchema: { type: "object", properties: { content_url: { type: "string" }, confirmed: { type: "boolean" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["content_url", "confirmed"] } },
        { name: "move_dynamic_page_row", description: "Moves a row to a new position.", inputSchema: { type: "object", properties: { folder_url: { type: "string" }, row_id: { type: "string" }, position: { type: "string" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["folder_url", "row_id", "position"] } },
        { name: "upload_file", description: "Uploads a file to Plone.", inputSchema: { type: "object", properties: { api_url: { type: "string" }, file_data: { type: "string", description: "Base64 encoded data" }, filename: { type: "string" }, content_type: { type: "string" }, title: { type: "string" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["api_url", "file_data", "filename"] } },
        { name: "upload_local_asset", description: "Reads a file from the local filesystem and uploads it to Plone.", inputSchema: { type: "object", properties: { api_url: { type: "string" }, local_path: { type: "string" }, token: { type: "string" }, cookie: { type: "string" } }, required: ["api_url", "local_path"] } }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const credentials: PloneCredentials = {
      api_url: (args?.api_url || args?.page_url || args?.folder_url || args?.content_url || sessionContext.api_url) as string,
      token: (args?.token || sessionContext.token) as string,
      cookie: (args?.cookie || sessionContext.cookie) as string
    };

    if (name !== "check_credentials_status" && name !== "set_session_context" && !credentials.api_url) {
      throw new McpError(ErrorCode.InvalidParams, "api_url is required");
    }

    try {
      switch (name) {
        case "check_credentials_status":
          return { content: [{ type: "text", text: JSON.stringify({ has_token: !!credentials.token, has_cookie: !!credentials.cookie, status: (credentials.token || credentials.cookie) ? "ready" : "missing" }, null, 2) }] };
        case "set_session_context":
          sessionContext = {
            api_url: (args?.api_url as string) || sessionContext.api_url,
            token: (args?.token as string) || sessionContext.token,
            cookie: (args?.cookie as string) || sessionContext.cookie
          };
          return { content: [{ type: "text", text: JSON.stringify({ status: "success", message: "Session context updated", context: { api_url: sessionContext.api_url, has_token: !!sessionContext.token, has_cookie: !!sessionContext.cookie } }, null, 2) }] };
        case "get_site_definitions":
          return { content: [{ type: "text", text: JSON.stringify(await getSiteDefinitions(credentials), null, 2) }] };
        case "get_dynamic_page_content":
          return { content: [{ type: "text", text: JSON.stringify(await getDynamicPageContent(credentials, credentials.api_url), null, 2) }] };
        case "create_content":
          return { content: [{ type: "text", text: JSON.stringify(await createContent(credentials, credentials.api_url, args!.content_type as string, args!.data as any), null, 2) }] };
        case "create_dynamic_page_row":
          return { content: [{ type: "text", text: JSON.stringify(await createRow(credentials, credentials.api_url, args!.row_data as any), null, 2) }] };
        case "create_dynamic_page_row_featured":
          return { content: [{ type: "text", text: JSON.stringify(await createFeatured(credentials, credentials.api_url, args!.feat_data as any), null, 2) }] };
        case "search_content":
          return { content: [{ type: "text", text: JSON.stringify(await searchContent(credentials, args?.query as string, args?.portal_type as string, args?.path as string, args?.limit as number), null, 2) }] };
        case "patch_content":
          return { content: [{ type: "text", text: JSON.stringify(await patchContent(credentials, credentials.api_url, args!.data as any), null, 2) }] };
        case "delete_content":
          if (!args?.confirmed) return { content: [{ type: "text", text: "Error: Deletion not confirmed." }], isError: true };
          await deleteContent(credentials, credentials.api_url);
          return { content: [{ type: "text", text: `Deleted ${credentials.api_url}` }] };
        case "move_dynamic_page_row":
          return { content: [{ type: "text", text: JSON.stringify(await moveRow(credentials, args!.folder_url as string, args!.row_id as string, args!.position as string), null, 2) }] };
        case "upload_file":
          return { content: [{ type: "text", text: JSON.stringify(await uploadAsset(credentials, credentials.api_url, { data: args!.file_data as string, filename: args!.filename as string, contentType: (args!.content_type as string) || "application/octet-stream", title: args!.title as string }), null, 2) }] };
        case "upload_local_asset":
          return { content: [{ type: "text", text: JSON.stringify(await uploadLocalAsset(credentials, credentials.api_url, args!.local_path as string), null, 2) }] };
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  });

  return server;
}
