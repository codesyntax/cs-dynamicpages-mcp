#!/usr/bin/env node

// src/local.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/plone-mcp.ts
import { createServer } from "@plone/mcp/dist/server.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import { wrapError } from "@plone/mcp/dist/utils/block-utils.js";
function getClient(extra) {
  const sessionId = extra.sessionId || "default";
  return sessionManager.getSession(sessionId).getClient();
}
function tryGetClient(extra) {
  const sessionId = extra.sessionId || "default";
  try {
    return sessionManager.getSession(sessionId).getClient();
  } catch {
    return null;
  }
}

// src/resources/docs.generated.ts
var architectureMd = '# Plone Dynamic Pages Architecture\n\nThis document describes the structure and logic of the `cs_dynamicpages` system in Plone.\n\n## Content Hierarchy\n\nA Dynamic Page in Plone follows a specific nesting pattern:\n\n1. **DynamicPage**: The main container (e.g., a landing page or a portal home).\n2. **DynamicPageFolder (ID: `rows`)**: A hidden folder inside every `DynamicPage` that contains all the layout sections.\n3. **DynamicPageRow**: A section of the page. Each row has a `row_type` that determines its layout and fields.\n4. **DynamicPageRowFeatured**: Optional child items inside a `DynamicPageRow`. These are used for sliders, accordions, or feature grids.\n\n## Key Concepts\n\n### The "Rows" Folder\nLayout sections (Rows) are not direct children of the `DynamicPage`. They MUST be created inside the `DynamicPageFolder` located at `{page_url}/rows`.\n\n### Row Types (`row_type`)\nThe `row_type` field is critical. It determines:\n- Which fields in `DynamicPageRow` schema are relevant.\n- If the row can have `DynamicPageRowFeatured` children (check `row_type_has_featured_add_button` in `RowTypes` definitions).\n- The visual rendering on the frontend.\n\n### Common Fields\n- **title**: Internal name of the row or featured item.\n- **description**: Often used as the main text block in a row.\n- **extra_class**: CSS classes applied to the row wrapper (useful for custom styling like `bg-light`, `text-center`).\n- **related_image**: A relation field to an Image object in Plone.\n- **query**: Used in "Collection" type rows to automatically fetch content based on criteria.\n\n## Asset Management\n- **Images**: Should be uploaded to an `images` or `imagenes` folder. Use `plone_search` to find existing assets before uploading new ones.\n- **Links**: Use absolute Plone paths (e.g., `/es/blog/post-1`) or external URLs.\n\n## Content Mapping Patterns (Migration)\nWhen migrating content from a PDF to a Dynamic Page structure:\n- **Heading 1 + Short Para** -> `header-hero-view` or `cs_dynamicpages-title-description-view`.\n- **Three/Four Bullet Points** -> `cs_dynamicpages-features-view` (Check `columns` field).\n- **Q&A or List of Details** -> `cs_dynamicpages-accordion-view`.\n- **Images with Text Overlays** -> `cs_dynamicpages-featured-overlay-view`.\n- **Long Narrative** -> `cs_dynamicpages-text-view` or `cs_dynamicpages-intro-text-view`.\n\n## Workflow Patterns\n- **Layout Discovery**: Always call `plone_get_dynamic_page_content` to see the full structure including rows and featured items.\n- **Validation**: Compare desired fields against schemas fetched via `plone_get_site_definitions` before sending a request.\n\n## Protocol Evolution & Performance Standards\n\nTo ensure optimal performance and reliability when managing Dynamic Pages, the following technical standards must be adhered to:\n\n### 1. Request Optimization (Batch Operations)\n- **Standard**: When creating rows with child items, use `plone_create_dynamic_page_row` with nested `featured` items in one call. This reduces server round-trips and ensures layout atomicity.\n- **Retrieval Optimization**: To avoid partial layout data, `plone_get_dynamic_page_content` fetches with `b_size=1000`. For general discovery, `plone_search` supports custom `b_size` (defaults to 25).\n\n### 2. Schema Enforcement & Validation\n- **Schema Validation**: The MCP agent must validate payloads against schemas fetched via `plone_get_site_definitions` *before* execution.\n- **Prefix Consistency**: Ensure `row_type` values match the naming defined in `RowTypes` returned by `plone_get_site_definitions` (e.g. `cs_dynamicpages-`).\n- **Mandatory Defaults**: Fields like `query` must be initialized (e.g., as an empty list `[]`) even if not used, to satisfy Plone\'s strict type validation.\n\n### 3. Error Observability\n- **Traceback Passthrough**: In the event of a `400 BadRequest` or `401 Unauthorized`, the full Plone traceback must be captured and returned to the agent. This allows for immediate self-correction of technical field mismatches or permission issues.\n- **Permission Transparency**: Credential checks must verify effective permissions on the specific target container (e.g., the `rows` folder) before attempting modifications.\n';
var migrationMd = '# Content Migration & Page Replication Expertise\n\nThis document outlines the protocol for replicating the structure of an existing Dynamic Page and populating it with new content extracted from a source document (like a PDF).\n\n## The "Skeleton + Mapping" Workflow\n\nWhen asked to "Replicate Page X using PDF Y", follow these steps:\n\n### 1. Structure Blueprinting (Extraction)\n- Call `plone_get_dynamic_page_content` on the **Source Page**.\n- Analyze the `rows_items_full` list.\n- For each row, record:\n    - `row_type` (The most critical field).\n    - Structural fields: `width`, `columns`, `extra_class`, `padding_*`, `margin_*`.\n    - Content placeholders: Identify where titles, descriptions, and featured items go.\n\n### 2. Semantic Data Extraction\n- Read the **PDF content**.\n- Segment the text into logical blocks that match the "shape" of the source rows.\n- If the source has a 3-column feature grid, find 3 distinct points or paragraphs in the PDF.\n\n### 3. Structural Mapping Rules\nMap PDF segments to Row Types based on these conventions:\n- **Hero/Header**: High-level value propositions, main titles.\n- **Features/Grid**: Lists of benefits, services, or product attributes.\n- **Accordion**: FAQs, technical specifications, or detailed lists.\n- **Text Blocks**: Narrative content or mission statements.\n\n### 4. Proposing the Blueprint (MANDATORY)\nBefore creating the new page, present a concise mapping to the user:\n- "Row 1 (Hero): Using \'Company Vision\' from PDF."\n- "Row 2 (3-Col Grid): Using the 3 service descriptions from PDF page 2."\n- "Row 3 (Accordion): Using the \'Terms & Conditions\' section."\n\n### 5. Execution (Targeted Creation)\n- Create the target **DynamicPage** (if it doesn\'t exist) using `plone_create_content`.\n- Navigate to `{target_page_url}/rows`.\n- Use `plone_create_dynamic_page_row` for each mapped row (optionally nesting featured items).\n- Ensure structural fields (`extra_class`, `width`) are copied exactly from the source to preserve the visual design.\n\n## Handling Mismatches\n- **PDF has more content**: Suggest adding new rows of the same type as the existing ones to maintain rhythm.\n- **PDF has less content**: Propose merging data or leaving specific sections out of the new page.\n- **Missing Images**: If the source has images but the PDF doesn\'t, use `plone_search` to find relevant generic images or ask the user for guidance.\n';

// src/resources/shared.ts
function markdownContent(uri, text) {
  return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
}
function jsonContent(uri, data) {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}
var NOT_CONFIGURED_MESSAGE = `This resource needs a Plone connection.

Call \`plone_configure({ baseUrl, token })\` (or \`plone_configure({})\` when \`PLONE_BASE_URL\`/\`PLONE_TOKEN\` are set), then read this resource again.`;
function notConfigured(uri) {
  return markdownContent(uri, NOT_CONFIGURED_MESSAGE);
}

// src/resources/docs_architecture.ts
var dynamicPagesArchitectureResource = {
  name: "cs-dynamicpages-architecture",
  uri: "cs-dynamicpages://docs/architecture",
  description: "Dynamic Pages architecture: content hierarchy, row types, common fields and migration mapping.",
  mimeType: "text/markdown",
  handler: async (uri) => markdownContent(uri, architectureMd)
};

// src/resources/docs_migration.ts
var dynamicPagesMigrationResource = {
  name: "cs-dynamicpages-migration",
  uri: "cs-dynamicpages://docs/migration",
  description: 'Content migration protocol: the "Skeleton + Mapping" workflow for replicating pages.',
  mimeType: "text/markdown",
  handler: async (uri) => markdownContent(uri, migrationMd)
};

// src/dynamicPages/constants.ts
var DYNAMIC_PAGES_REGISTRY_KEY = "cs_dynamicpages.dynamic_pages_control_panel.row_type_fields";

// src/resources/row_types.ts
var dynamicPagesRowTypesResource = {
  name: "cs-dynamicpages-row-types",
  uri: "cs-dynamicpages://row-types",
  description: "Available DynamicPage row types, read from the site registry (row_type_fields).",
  mimeType: "application/json",
  handler: async (uri, extra) => {
    const client = tryGetClient(extra);
    if (!client) return notConfigured(uri);
    return jsonContent(uri, await client.get(`/@registry/${DYNAMIC_PAGES_REGISTRY_KEY}`));
  }
};

// src/resources/schemas.ts
var dynamicPagesRowSchemaResource = {
  name: "cs-dynamicpages-row-schema",
  uri: "cs-dynamicpages://schemas/row",
  description: "JSON schema of the DynamicPageRow content type.",
  mimeType: "application/json",
  handler: async (uri, extra) => {
    const client = tryGetClient(extra);
    if (!client) return notConfigured(uri);
    return jsonContent(uri, await client.get("/@types/DynamicPageRow"));
  }
};
var dynamicPagesRowFeaturedSchemaResource = {
  name: "cs-dynamicpages-row-featured-schema",
  uri: "cs-dynamicpages://schemas/row-featured",
  description: "JSON schema of the DynamicPageRowFeatured content type.",
  mimeType: "application/json",
  handler: async (uri, extra) => {
    const client = tryGetClient(extra);
    if (!client) return notConfigured(uri);
    return jsonContent(uri, await client.get("/@types/DynamicPageRowFeatured"));
  }
};

// src/resources/index.ts
var dynamicPagesResources = [
  dynamicPagesArchitectureResource,
  dynamicPagesMigrationResource,
  dynamicPagesRowTypesResource,
  dynamicPagesRowSchemaResource,
  dynamicPagesRowFeaturedSchemaResource
];
function registerDynamicPagesResources(server) {
  for (const resource of dynamicPagesResources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        description: resource.description,
        mimeType: resource.mimeType
      },
      resource.handler
    );
  }
}

// src/tools/plone_create_dynamic_page_row.ts
import { z as z2 } from "zod";

// src/dynamicPages/payloads.ts
function buildRowPayload({ title, row_type, fields }) {
  return {
    ...fields || {},
    "@type": "DynamicPageRow",
    title: title || "New Row",
    row_type
  };
}
function buildFeaturedPayload({ title, fields }) {
  return {
    ...fields || {},
    "@type": "DynamicPageRowFeatured",
    title: title || "Featured Item"
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

// src/tools/shared.ts
import { z } from "zod";
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
  row_type: z.string().describe(
    "Row type id from the site definitions, e.g. 'cs_dynamicpages-title-description-view' (call plone_get_site_definitions for the available values)"
  ),
  fields: z.record(z.string(), z.unknown()).optional().describe("Custom field values for the row"),
  featured: z.array(featuredInputSchema).optional().describe("Featured items to create inside the row")
});

// src/tools/plone_create_dynamic_page_row.ts
var ploneCreateDynamicPageRow = {
  name: "plone_create_dynamic_page_row",
  description: "Creates a DynamicPageRow inside a dynamic page's rows folder. Optionally creates featured items within the row at the same time.",
  inputSchema: z2.object({
    parentPath: z2.string().describe(
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
};

// src/tools/plone_create_dynamic_page_row_featured.ts
import { z as z3 } from "zod";
var ploneCreateDynamicPageRowFeatured = {
  name: "plone_create_dynamic_page_row_featured",
  description: "Creates a DynamicPageRowFeatured item inside an existing DynamicPageRow.",
  inputSchema: z3.object({
    parentRowPath: z3.string().describe("Path of the parent DynamicPageRow"),
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
};

// src/tools/plone_get_dynamic_page_content.ts
import { z as z4 } from "zod";

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
    const pageRows = rows.filter((row) => {
      const rowId = stripTrailingSlash(String(row["@id"]));
      return rowId === rowsFolderId || rowId.startsWith(`${rowsFolderId}/`);
    });
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

// src/tools/plone_get_dynamic_page_content.ts
var ploneGetDynamicPageContent = {
  name: "plone_get_dynamic_page_content",
  description: "Retrieves the full JSON structure of a dynamic page, including its rows, the DynamicPageFolder summary and all featured items attached to each row.",
  inputSchema: z4.object({
    path: z4.string().describe("Path to the dynamic page, e.g. '/' or '/en/home'")
  }),
  handler: runWith("GetDynamicPageContent", async (args, extra) => {
    const client = getClient(extra);
    const pagePath = normalizePath(localPath(args.path));
    const pageData = await client.get(pagePath, { b_size: 1e3 });
    const searchParams = new URLSearchParams();
    searchParams.append("portal_type", "DynamicPageRow");
    searchParams.append("portal_type", "DynamicPageRowFeatured");
    searchParams.append("path", pagePath);
    searchParams.append("fullobjects", "1");
    searchParams.append("sort_on", "getObjPositionInParent");
    searchParams.append("b_size", "1000");
    const search = await client.get(
      "/@search",
      searchParams
    );
    const items = search.items || [];
    return textContent(
      reassembleDynamicContent(pageData, items)
    );
  })
};

// src/tools/plone_get_site_definitions.ts
import { z as z5 } from "zod";
var ploneGetSiteDefinitions = {
  name: "plone_get_site_definitions",
  description: "Fetches the site-specific dynamic pages definitions: the DynamicPageRow and DynamicPageRowFeatured schemas and the list of available row types.",
  inputSchema: z5.object({}),
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
};

// src/tools/plone_move_dynamic_page_row.ts
import { z as z6 } from "zod";

// src/dynamicPages/ordering.ts
function rowShortName(rowId) {
  const trimmed = stripTrailingSlash(rowId);
  if (!trimmed.includes("/")) return trimmed;
  return trimmed.split("/").pop() || trimmed;
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
    ordering: { obj_id: objId, delta: Number(position) - 1 - currentPos }
  };
}

// src/tools/plone_move_dynamic_page_row.ts
var ploneMoveDynamicPageRow = {
  name: "plone_move_dynamic_page_row",
  description: "Reorders a DynamicPageRow within its DynamicPageFolder. Position can be a 1-based target position or 'top'/'bottom'.",
  inputSchema: z6.object({
    folderPath: z6.string().describe("Path of the DynamicPageFolder containing the row"),
    rowId: z6.string().describe("The id or full URL of the row to move"),
    position: z6.string().describe("Target position: a 1-based number, or 'top'/'bottom'")
  }),
  handler: runWith("MoveDynamicPageRow", async (args, extra) => {
    const client = getClient(extra);
    const folderPath = localPath(args.folderPath);
    const folder = await client.get(folderPath, { b_size: 1e3 });
    const items = folder.items || [];
    const ordering = computeOrderingPayload(items, args.rowId, args.position);
    return textContent(await client.patch(folderPath, ordering));
  })
};

// src/tools/plone_upload_file.ts
import { z as z7 } from "zod";
var ploneUploadFile = {
  name: "plone_upload_file",
  description: "Uploads an image or file to Plone from base64-encoded data, creating an Image or File object.",
  inputSchema: z7.object({
    basePath: z7.string().describe("Path of the folder where the file is uploaded"),
    fileData: z7.string().describe("Base64 encoded file data"),
    filename: z7.string().describe("Filename of the uploaded file"),
    contentType: z7.string().optional().describe(
      "MIME type of the uploaded file; defaults to application/octet-stream"
    ),
    title: z7.string().optional().describe("Optional title; defaults to the filename")
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
};

// src/tools/plone_upload_local_asset.ts
import { z as z8 } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
var ploneUploadLocalAsset = {
  name: "plone_upload_local_asset",
  description: "Reads a file from the local filesystem and uploads it to Plone.",
  inputSchema: z8.object({
    basePath: z8.string().describe("Path of the folder where the file is uploaded"),
    localPath: z8.string().describe("Absolute or relative path of the local file to upload")
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
    return textContent(await client.post(localPath(args.basePath), payload));
  })
};

// src/tools/index.ts
var dynamicPagesTools = [
  ploneGetSiteDefinitions,
  ploneGetDynamicPageContent,
  ploneCreateDynamicPageRow,
  ploneCreateDynamicPageRowFeatured,
  ploneMoveDynamicPageRow,
  ploneUploadFile,
  ploneUploadLocalAsset
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
  registerDynamicPagesResources(server);
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
