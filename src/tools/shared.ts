import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getClient, wrapError, type Extra } from "../plone-mcp";

export { getClient };
export type { Extra };

export type ToolHandler = (args: any, extra: Extra) => Promise<CallToolResult>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: ToolHandler;
}

export function textContent(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

/** Wraps a handler body so any failure surfaces as a consistent, prefixed error. */
export function runWith(operation: string, fn: ToolHandler): ToolHandler {
  return async (args, extra) => {
    try {
      return await fn(args, extra);
    } catch (error) {
      throw wrapError(operation, error);
    }
  };
}

export const featuredInputSchema = z.object({
  title: z.string().optional().describe("Title of the featured item"),
  fields: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Custom field values for the featured item"),
});

export const rowInputSchema = z.object({
  title: z.string().optional().describe("Title of the row"),
  row_type: z
    .string()
    .describe(
      "Row type id from the site definitions, e.g. 'cs_dynamicpages-title-description-view' (call plone_get_site_definitions for the available values)",
    ),
  fields: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Custom field values for the row"),
  featured: z
    .array(featuredInputSchema)
    .optional()
    .describe("Featured items to create inside the row"),
});
