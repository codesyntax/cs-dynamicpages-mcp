import { z } from "zod";
import type { JsonRecord } from "../dynamicPages/payloads";
import { localPath, normalizePath } from "../dynamicPages/paths";
import { reassembleDynamicContent } from "../dynamicPages/reassemble";
import { getClient, runWith, textContent, type ToolDefinition } from "./shared";

export const ploneGetDynamicPageContent: ToolDefinition = {
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
};
