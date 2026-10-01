import { tryGetClient } from "../plone-mcp";
import { jsonContent, notConfigured, type ResourceDefinition } from "./shared";

export const dynamicPagesRowSchemaResource: ResourceDefinition = {
  name: "cs-dynamicpages-row-schema",
  uri: "cs-dynamicpages://schemas/row",
  description: "JSON schema of the DynamicPageRow content type.",
  mimeType: "application/json",
  handler: async (uri, extra) => {
    const client = tryGetClient(extra);
    if (!client) return notConfigured(uri);
    return jsonContent(uri, await client.get("/@types/DynamicPageRow"));
  },
};

export const dynamicPagesRowFeaturedSchemaResource: ResourceDefinition = {
  name: "cs-dynamicpages-row-featured-schema",
  uri: "cs-dynamicpages://schemas/row-featured",
  description: "JSON schema of the DynamicPageRowFeatured content type.",
  mimeType: "application/json",
  handler: async (uri, extra) => {
    const client = tryGetClient(extra);
    if (!client) return notConfigured(uri);
    return jsonContent(uri, await client.get("/@types/DynamicPageRowFeatured"));
  },
};
