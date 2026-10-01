import { migrationMd } from "./docs.generated";
import { markdownContent, type ResourceDefinition } from "./shared";

export const dynamicPagesMigrationResource: ResourceDefinition = {
  name: "cs-dynamicpages-migration",
  uri: "cs-dynamicpages://docs/migration",
  description:
    "Content migration protocol: the \"Skeleton + Mapping\" workflow for replicating pages.",
  mimeType: "text/markdown",
  handler: async (uri) => markdownContent(uri, migrationMd),
};
