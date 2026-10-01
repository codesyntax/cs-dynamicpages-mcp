import { z } from "zod";
import { getClient, runWith, textContent, type ToolDefinition } from "./shared";

const DYNAMIC_PAGES_REGISTRY_KEY =
  "cs_dynamicpages.dynamic_pages_control_panel.row_type_fields";

export const ploneGetSiteDefinitions: ToolDefinition = {
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
};
