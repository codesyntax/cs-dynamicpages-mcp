#!/usr/bin/env node

// src/local.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/plone-mcp.ts
import { createServer } from "@plone/mcp/dist/server.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import { wrapError } from "@plone/mcp/dist/utils/block-utils.js";

// src/tools/registerDynamicPagesTools.ts
import { z } from "zod";

// src/dynamicPages/payloads.ts
function buildRowPayload({ title, row_type, fields }) {
  return {
    "@type": "DynamicPageRow",
    title: title || "New Row",
    row_type,
    ...fields || {}
  };
}
function buildFeaturedPayload({ title, fields }) {
  return {
    "@type": "DynamicPageRowFeatured",
    title: title || "Featured Item",
    ...fields || {}
  };
}
var MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".zip": "application/zip"
};
function guessMimeType(filename) {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}
function buildUploadPayload({ filename, data, contentType, title }) {
  const isImage = contentType.startsWith("image/");
  return {
    "@type": isImage ? "Image" : "File",
    title: title || filename,
    [isImage ? "image" : "file"]: {
      data,
      encoding: "base64",
      "content-type": contentType,
      filename
    }
  };
}

// src/dynamicPages/paths.ts
function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
function normalizePath(p) {
  if (!p || p === "/") return "/";
  return stripTrailingSlash(p);
}
function localPath(id) {
  if (!/^https?:\/\//.test(id)) return id;
  const afterApi = id.split("/++api++")[1];
  if (afterApi === void 0) return id;
  const trimmed = stripTrailingSlash(afterApi);
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

// src/dynamicPages/ordering.ts
function rowShortName(rowId) {
  if (!rowId.includes("://")) return rowId;
  return stripTrailingSlash(rowId).split("/").pop();
}
function computeOrderingPayload(folderItems, rowId, position) {
  const objId = rowShortName(rowId);
  if (Number.isNaN(Number(position))) {
    return { ordering: { obj_id: objId, delta: position } };
  }
  const currentPos = folderItems.findIndex(
    (item) => rowShortName(String(item["@id"])) === objId
  );
  if (currentPos === -1) {
    throw new Error("Row not found in folder");
  }
  return {
    ordering: { obj_id: objId, delta: Number(position) - currentPos }
  };
}

// src/dynamicPages/reassemble.ts
function reassembleDynamicContent(pageData, searchResults) {
  const rows = [];
  const featuredByParent = {};
  for (const item of searchResults) {
    if (item["@type"] === "DynamicPageRow") {
      rows.push(item);
    } else if (item["@type"] === "DynamicPageRowFeatured") {
      const parentUrl = splitParent(String(item["@id"]));
      if (!featuredByParent[parentUrl]) featuredByParent[parentUrl] = [];
      featuredByParent[parentUrl].push(item);
    }
  }
  const items = pageData.items || [];
  const rowsFolderSummary = items.find((item) => item["@type"] === "DynamicPageFolder");
  const result = { ...pageData };
  if (rowsFolderSummary) {
    const rowsFolderId = stripTrailingSlash(String(rowsFolderSummary["@id"]));
    const pageRows = rows.filter(
      (row) => String(row["@id"]).startsWith(rowsFolderId)
    );
    const rowsItemsFull = pageRows.map((row) => {
      const rowId = stripTrailingSlash(String(row["@id"]));
      return {
        ...row,
        featured_items_full: featuredByParent[rowId] || []
      };
    });
    result.dynamic_rows_folder_full = {
      "@id": rowsFolderSummary["@id"],
      "@type": "DynamicPageFolder",
      rows_items_full: rowsItemsFull
    };
  }
  return result;
}
function splitParent(id) {
  return id.split("/").slice(0, -1).join("/");
}

// src/tools/registerDynamicPagesTools.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
var DYNAMIC_PAGES_REGISTRY_KEY = "cs_dynamicpages.dynamic_pages_control_panel.row_type_fields";
function getClient(extra) {
  const sessionId = extra.sessionId || "default";
  return sessionManager.getSession(sessionId).getClient();
}
function textContent(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
  };
}
function runWith(operation, fn) {
  return async (args, extra) => {
    try {
      return await fn(args, extra);
    } catch (error) {
      throw wrapError(operation, error);
    }
  };
}
var featuredInputSchema = z.object({
  title: z.string().optional().describe("Title of the featured item"),
  fields: z.record(z.string(), z.unknown()).optional().describe("Custom field values for the featured item")
});
var rowInputSchema = z.object({
  title: z.string().optional().describe("Title of the row"),
  row_type: z.string().describe("Row type, e.g. 'hero' or 'columns'"),
  fields: z.record(z.string(), z.unknown()).optional().describe("Custom field values for the row"),
  featured: z.array(featuredInputSchema).optional().describe("Featured items to create inside the row")
});
var dynamicPagesTools = [
  {
    name: "plone_get_site_definitions",
    description: "Fetches the site-specific dynamic pages definitions: the DynamicPageRow and DynamicPageRowFeatured schemas and the list of available row types.",
    inputSchema: z.object({}),
    handler: runWith("GetSiteDefinitions", async (_, extra) => {
      const client = getClient(extra);
      const [rowSchema, featSchema, rowTypes] = await Promise.all([
        client.get("/@types/DynamicPageRow"),
        client.get("/@types/DynamicPageRowFeatured"),
        client.get(`/@registry/${DYNAMIC_PAGES_REGISTRY_KEY}`)
      ]);
      return textContent({
        DynamicPageRow: rowSchema,
        DynamicPageRowFeatured: featSchema,
        RowTypes: rowTypes
      });
    })
  },
  {
    name: "plone_get_dynamic_page_content",
    description: "Retrieves the full JSON structure of a dynamic page, including its rows, the DynamicPageFolder summary and all featured items attached to each row.",
    inputSchema: z.object({
      path: z.string().describe("Path to the dynamic page, e.g. '/' or '/en/home'")
    }),
    handler: runWith("GetDynamicPageContent", async (args, extra) => {
      const client = getClient(extra);
      const pagePath = normalizePath(localPath(args.path));
      const pageData = await client.get(pagePath, { b_size: 1e3 });
      const search = await client.get("/@search", {
        path: pagePath,
        portal_type: "DynamicPageRow,DynamicPageRowFeatured",
        fullobjects: 1,
        metadata_fields: "portal_type",
        sort_on: "getObjPositionInParent",
        b_size: 1e3
      });
      const items = search.items || [];
      return textContent(
        reassembleDynamicContent(pageData, items)
      );
    })
  },
  {
    name: "plone_create_dynamic_page_row",
    description: "Creates a DynamicPageRow inside a dynamic page's rows folder. Optionally creates featured items within the row at the same time.",
    inputSchema: z.object({
      parentPath: z.string().describe(
        "Path of the DynamicPageFolder (rows folder) where the row is created"
      ),
      rowData: rowInputSchema
    }),
    handler: runWith("CreateDynamicPageRow", async (args, extra) => {
      const client = getClient(extra);
      const rowData = args.rowData;
      const row = await client.post(
        localPath(args.parentPath),
        buildRowPayload(rowData)
      );
      const rowId = row["@id"];
      if (!rowId) throw new Error("Created row returned no @id");
      const rowPath = localPath(rowId);
      for (const feat of rowData.featured || []) {
        await client.post(rowPath, buildFeaturedPayload(feat));
      }
      return textContent(row);
    })
  },
  {
    name: "plone_create_dynamic_page_row_featured",
    description: "Creates a DynamicPageRowFeatured item inside an existing DynamicPageRow.",
    inputSchema: z.object({
      parentRowPath: z.string().describe("Path of the parent DynamicPageRow"),
      featData: featuredInputSchema
    }),
    handler: runWith("CreateDynamicPageRowFeatured", async (args, extra) => {
      const client = getClient(extra);
      const row = await client.post(
        localPath(args.parentRowPath),
        buildFeaturedPayload(args.featData)
      );
      return textContent(row);
    })
  },
  {
    name: "plone_move_dynamic_page_row",
    description: "Reorders a DynamicPageRow within its DynamicPageFolder. Position can be a 1-based target position or 'top'/'bottom'.",
    inputSchema: z.object({
      folderPath: z.string().describe("Path of the DynamicPageFolder containing the row"),
      rowId: z.string().describe("The id or full URL of the row to move"),
      position: z.string().describe("Target position: a 1-based number, or 'top'/'bottom'")
    }),
    handler: runWith("MoveDynamicPageRow", async (args, extra) => {
      const client = getClient(extra);
      const folderPath = localPath(args.folderPath);
      const folder = await client.get(folderPath);
      const items = folder.items || [];
      const ordering = computeOrderingPayload(
        items,
        args.rowId,
        args.position
      );
      return textContent(await client.patch(folderPath, ordering));
    })
  },
  {
    name: "plone_upload_file",
    description: "Uploads an image or file to Plone from base64-encoded data, creating an Image or File object.",
    inputSchema: z.object({
      basePath: z.string().describe("Path of the folder where the file is uploaded"),
      fileData: z.string().describe("Base64 encoded file data"),
      filename: z.string().describe("Filename of the uploaded file"),
      contentType: z.string().optional().describe(
        "MIME type of the uploaded file; defaults to application/octet-stream"
      ),
      title: z.string().optional().describe("Optional title; defaults to the filename")
    }),
    handler: runWith("UploadFile", async (args, extra) => {
      const client = getClient(extra);
      const payload = buildUploadPayload({
        filename: args.filename,
        data: args.fileData,
        contentType: args.contentType || "application/octet-stream",
        title: args.title
      });
      return textContent(await client.post(localPath(args.basePath), payload));
    })
  },
  {
    name: "plone_upload_local_asset",
    description: "Reads a file from the local filesystem and uploads it to Plone.",
    inputSchema: z.object({
      basePath: z.string().describe("Path of the folder where the file is uploaded"),
      localPath: z.string().describe(
        "Absolute or relative path of the local file to upload"
      )
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
        await client.post(localPath(args.basePath), payload)
      );
    })
  }
];
function registerDynamicPagesTools(server) {
  const enabledToolsEnv = process.env.ENABLED_TOOLS;
  const enabledTools = enabledToolsEnv ? new Set(enabledToolsEnv.split(",").map((t) => t.trim())) : null;
  for (const tool of dynamicPagesTools) {
    if (enabledTools && !enabledTools.has(tool.name)) continue;
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema
      },
      tool.handler
    );
  }
}

// src/extended-server.ts
function createExtendedServer() {
  const server = createServer();
  registerDynamicPagesTools(server);
  return server;
}

// src/local.ts
async function main() {
  const server = createExtendedServer();
  const transport = new StdioServerTransport();
  console.error("Plone MCP server (extended with dynamic pages tools) starting on stdio...");
  await server.connect(transport);
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}
main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
//# sourceMappingURL=local.js.map
