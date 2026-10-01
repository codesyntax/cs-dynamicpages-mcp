import { z } from "zod";
import { computeOrderingPayload } from "../dynamicPages/ordering";
import { localPath } from "../dynamicPages/paths";
import { getClient, runWith, textContent, type ToolDefinition } from "./shared";

export const ploneMoveDynamicPageRow: ToolDefinition = {
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
    const ordering = computeOrderingPayload(items, args.rowId, args.position);
    return textContent(await client.patch(folderPath, ordering));
  }),
};
