import { createServer } from "./plone-mcp";
import { registerDynamicPagesResources } from "./resources/index";
import { registerDynamicPagesTools } from "./tools/index";

export function createExtendedServer() {
  const server = createServer();
  registerDynamicPagesTools(server);
  registerDynamicPagesResources(server);
  return server;
}
