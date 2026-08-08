import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import { wrapError } from "@plone/mcp/dist/utils/block-utils.js";
import {
  buildFeaturedPayload,
  buildRowPayload,
  buildUploadPayload,
  guessMimeType,
  type FeaturedInput,
  type JsonRecord,
  type RowInput,
} from "../dynamicPages/payloads";
import { computeOrderingPayload } from "../dynamicPages/ordering";
import { localPath, normalizePath } from "../dynamicPages/paths";
import { reassembleDynamicContent } from "../dynamicPages/reassemble";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const DYNAMIC_PAGES_REGISTRY_KEY =
  "cs_dynamicpages.dynamic_pages_control_panel.row_type_fields";

type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>;
type ToolHandler = (args: any, extra: Extra) => Promise<CallToolResult>;

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: ToolHandler;
}

function getClient(extra: Extra) {
  const sessionId = extra.sessionId || "default";
  return sessionManager.getSession(sessionId).getClient();
}

function textContent(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/** Wraps a handler body so any failure surfaces as a consistent, prefixed error. */
function runWith(
  operation: string,
  fn: (args: any, extra: Extra) => Promise<CallToolResult>,
): ToolHandler {
  return async (args, extra) => {
    try {
      return await fn(args, extra);
    } catch (error) {
      throw wrapError(operation, error);
    }
  };
}

const featuredInputSchema = z.object({
  title: z.string().optional().describe("Title of the featured item"),
  fields: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Custom field values for the featured item"),
});

const rowInputSchema = z.object({
  title: z.string().optional().describe("Title of the row"),
  row_type: z.string().describe("Row type, e.g. 'hero' or 'columns'"),
  fields: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Custom field values for the row"),
  featured: z
    .array(featuredInputSchema)
    .optional()
    .describe("Featured items to create inside the row"),
});

export const dynamicPagesTools: ToolDefinition[] = [
  {
    name: "plone_get_site_definitions",
    description:
      "Fetches the site-specific dynamic pages definitions: the DynamicPageRow and DynamicPageRowFeatured schemas and the list of available row types.",
    inputSchema: z.object({}),
    handler: runWith("GetSiteDefinitions", async (_, extra) => {
      const client = getClient(extra);
      const [rowSchema, featSchema, rowTypes] = await Promise.all([
        client.get("/@types/DynamicPageRow"),
        client.get("/@types/DynamicPageRowFeatured"),
        client.get(`/@registry/${DYNAMIC_PAGES_REGISTRY_KEY}`),
      ]);
      return textContent({
        DynamicPageRow: rowSchema,
        DynamicPageRowFeatured: featSchema,
        RowTypes: rowTypes,
      });
    }),
  },
  {
    name: "plone_get_dynamic_page_content",
    description:
      "Retrieves the full JSON structure of a dynamic page, including its rows, the DynamicPageFolder summary and all featured items attached to each row.",
    inputSchema: z.object({
      path: z
        .string()
        .describe("Path to the dynamic page, e.g. '/' or '/en/home'"),
    }),
    handler: runWith("GetDynamicPageContent", async (args, extra) => {
      const client = getClient(extra);
      const pagePath = normalizePath(localPath(args.path));
      const pageData = await client.get(pagePath, { b_size: 1000 });
      const search = await client.get("/@search", {
        path: pagePath,
        portal_type: "DynamicPageRow,DynamicPageRowFeatured",
        fullobjects: 1,
        metadata_fields: "portal_type",
        sort_on: "getObjPositionInParent",
        b_size: 1000,
      });
      const items = (search as { items?: JsonRecord[] }).items || [];
      return textContent(
        reassembleDynamicContent(pageData as Record<string, unknown>, items),
      );
    }),
  },
  {
    name: "plone_create_dynamic_page_row",
    description:
      "Creates a DynamicPageRow inside a dynamic page's rows folder. Optionally creates featured items within the row at the same time.",
    inputSchema: z.object({
      parentPath: z
        .string()
        .describe(
          "Path of the DynamicPageFolder (rows folder) where the row is created",
        ),
      rowData: rowInputSchema,
    }),
    handler: runWith("CreateDynamicPageRow", async (args, extra) => {
      const client = getClient(extra);
      const rowData = args.rowData as RowInput;
      const row = (await client.post(
        localPath(args.parentPath),
        buildRowPayload(rowData),
      )) as { "@id"?: string };
      const rowId = row["@id"];
      if (!rowId) throw new Error("Created row returned no @id");
      const rowPath = localPath(rowId);
      for (const feat of rowData.featured || []) {
        await client.post(rowPath, buildFeaturedPayload(feat as FeaturedInput));
      }
      return textContent(row);
    }),
  },
  {
    name: "plone_create_dynamic_page_row_featured",
    description:
      "Creates a DynamicPageRowFeatured item inside an existing DynamicPageRow.",
    inputSchema: z.object({
      parentRowPath: z
        .string()
        .describe("Path of the parent DynamicPageRow"),
      featData: featuredInputSchema,
    }),
    handler: runWith("CreateDynamicPageRowFeatured", async (args, extra) => {
      const client = getClient(extra);
      const row = await client.post(
        localPath(args.parentRowPath),
        buildFeaturedPayload(args.featData as FeaturedInput),
      );
      return textContent(row);
    }),
  },
  {
    name: "plone_move_dynamic_page_row",
    description:
      "Reorders a DynamicPageRow within its DynamicPageFolder. Position can be a 1-based target position or 'top'/'bottom'.",
    inputSchema: z.object({
      folderPath: z
        .string()
        .describe("Path of the DynamicPageFolder containing the row"),
      rowId: z.string().describe("The id or full URL of the row to move"),
      position: z
        .string()
        .describe("Target position: a 1-based number, or 'top'/'bottom'"),
    }),
    handler: runWith("MoveDynamicPageRow", async (args, extra) => {
      const client = getClient(extra);
      const folderPath = localPath(args.folderPath);
      const folder = (await client.get(folderPath)) as {
        items?: Record<string, unknown>[];
      };
      const items = folder.items || [];
      const ordering = computeOrderingPayload(
        items,
        args.rowId,
        args.position,
      );
      return textContent(await client.patch(folderPath, ordering));
    }),
  },
  {
    name: "plone_upload_file",
    description:
      "Uploads an image or file to Plone from base64-encoded data, creating an Image or File object.",
    inputSchema: z.object({
      basePath: z
        .string()
        .describe("Path of the folder where the file is uploaded"),
      fileData: z.string().describe("Base64 encoded file data"),
      filename: z.string().describe("Filename of the uploaded file"),
      contentType: z
        .string()
        .optional()
        .describe(
          "MIME type of the uploaded file; defaults to application/octet-stream",
        ),
      title: z
        .string()
        .optional()
        .describe("Optional title; defaults to the filename"),
    }),
    handler: runWith("UploadFile", async (args, extra) => {
      const client = getClient(extra);
      const payload = buildUploadPayload({
        filename: args.filename,
        data: args.fileData,
        contentType: args.contentType || "application/octet-stream",
        title: args.title,
      });
      return textContent(await client.post(localPath(args.basePath), payload));
    }),
  },
  {
    name: "plone_upload_local_asset",
    description:
      "Reads a file from the local filesystem and uploads it to Plone.",
    inputSchema: z.object({
      basePath: z
        .string()
        .describe("Path of the folder where the file is uploaded"),
      localPath: z
        .string()
        .describe(
          "Absolute or relative path of the local file to upload",
        ),
    }),
    handler: runWith("UploadLocalAsset", async (args, extra) => {
      const client = getClient(extra);
      const absolutePath = path.resolve(args.localPath);
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${absolutePath}`);
      }
      const filename = path.basename(absolutePath);
      const contentType = guessMimeType(filename);
      const data = (await fs.readFile(absolutePath)).toString("base64");
      const payload = buildUploadPayload({ filename, data, contentType });
      return textContent(
        await client.post(localPath(args.basePath), payload),
      );
    }),
  },
];

export function registerDynamicPagesTools(server: McpServer) {
  for (const tool of dynamicPagesTools) {
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
