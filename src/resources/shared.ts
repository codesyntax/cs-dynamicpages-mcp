import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import type { Extra } from "../plone-mcp";

export interface ResourceDefinition {
  name: string;
  uri: string;
  description: string;
  mimeType: string;
  handler: (
    uri: URL,
    extra: Extra,
  ) => ReadResourceResult | Promise<ReadResourceResult>;
}

export function markdownContent(uri: URL, text: string): ReadResourceResult {
  return { contents: [{ uri: uri.href, mimeType: "text/markdown", text }] };
}

export function jsonContent(uri: URL, data: unknown): ReadResourceResult {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export const NOT_CONFIGURED_MESSAGE = `This resource needs a Plone connection.

Call \`plone_configure({ baseUrl, token })\` (or \`plone_configure({})\` when \`PLONE_BASE_URL\`/\`PLONE_TOKEN\` are set), then read this resource again.`;

/**
 * Resources cannot signal errors with an `isError` flag, so a missing
 * plone_configure connection is returned as actionable markdown instead of a
 * protocol error.
 */
export function notConfigured(uri: URL): ReadResourceResult {
  return markdownContent(uri, NOT_CONFIGURED_MESSAGE);
}
