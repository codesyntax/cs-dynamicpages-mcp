import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { dynamicPagesArchitectureResource } from "./docs_architecture";
import { dynamicPagesMigrationResource } from "./docs_migration";
import { dynamicPagesRowTypesResource } from "./row_types";
import {
  dynamicPagesRowFeaturedSchemaResource,
  dynamicPagesRowSchemaResource,
} from "./schemas";
import type { ResourceDefinition } from "./shared";

export const dynamicPagesResources: ResourceDefinition[] = [
  dynamicPagesArchitectureResource,
  dynamicPagesMigrationResource,
  dynamicPagesRowTypesResource,
  dynamicPagesRowSchemaResource,
  dynamicPagesRowFeaturedSchemaResource,
];

export function registerDynamicPagesResources(server: McpServer) {
  for (const resource of dynamicPagesResources) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        description: resource.description,
        mimeType: resource.mimeType,
      },
      resource.handler,
    );
  }
}
