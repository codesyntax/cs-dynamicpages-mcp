import { architectureMd } from "./docs.generated";
import { markdownContent, type ResourceDefinition } from "./shared";

export const dynamicPagesArchitectureResource: ResourceDefinition = {
  name: "cs-dynamicpages-architecture",
  uri: "cs-dynamicpages://docs/architecture",
  description:
    "Dynamic Pages architecture: content hierarchy, row types, common fields and migration mapping.",
  mimeType: "text/markdown",
  handler: async (uri) => markdownContent(uri, architectureMd),
};
