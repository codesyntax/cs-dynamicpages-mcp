import { DYNAMIC_PAGES_REGISTRY_KEY } from "../dynamicPages/constants";
import { tryGetClient } from "../plone-mcp";
import { jsonContent, notConfigured, type ResourceDefinition } from "./shared";

export const dynamicPagesRowTypesResource: ResourceDefinition = {
  name: "cs-dynamicpages-row-types",
  uri: "cs-dynamicpages://row-types",
  description:
    "Available DynamicPage row types, read from the site registry (row_type_fields).",
  mimeType: "application/json",
  handler: async (uri, extra) => {
    const client = tryGetClient(extra);
    if (!client) return notConfigured(uri);
    return jsonContent(uri, await client.get(`/@registry/${DYNAMIC_PAGES_REGISTRY_KEY}`));
  },
};
