import { z } from "zod";
import { buildFeaturedPayload, type FeaturedInput } from "../dynamicPages/payloads";
import { localPath } from "../dynamicPages/paths";
import {
  featuredInputSchema,
  getClient,
  runWith,
  textContent,
  type ToolDefinition,
} from "./shared";

export const ploneCreateDynamicPageRowFeatured: ToolDefinition = {
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
};
