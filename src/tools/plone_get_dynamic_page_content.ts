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
    // plone.restapi does not split comma-separated `portal_type` values, and
    // axios serialises JS arrays as `portal_type[]=...`, which is ignored. Use
    // repeated query parameters (URLSearchParams) so the filter actually applies.
    const searchParams = new URLSearchParams();
    searchParams.append("portal_type", "DynamicPageRow");
    searchParams.append("portal_type", "DynamicPageRowFeatured");
    searchParams.append("path", pagePath);
    searchParams.append("fullobjects", "1");
    searchParams.append("sort_on", "getObjPositionInParent");
    searchParams.append("b_size", "1000");
    const search = await client.get(
      "/@search",
      searchParams as unknown as Record<string, unknown>,
    );
    const items = (search as { items?: JsonRecord[] }).items || [];
    return textContent(
      reassembleDynamicContent(pageData as Record<string, unknown>, items),
    );
  }),
};
