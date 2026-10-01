import { z } from "zod";
import {
  buildFeaturedPayload,
  buildRowPayload,
  type FeaturedInput,
  type RowInput,
} from "../dynamicPages/payloads";
import { localPath } from "../dynamicPages/paths";
import {
  getClient,
  rowInputSchema,
  runWith,
  textContent,
  type ToolDefinition,
} from "./shared";

export const ploneCreateDynamicPageRow: ToolDefinition = {
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
};
