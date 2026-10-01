import { createServer } from "./plone-mcp";
import { registerDynamicPagesTools } from "./tools/registerDynamicPagesTools";

export function createExtendedServer() {
  const server = createServer();
  registerDynamicPagesTools(server);
  return server;
}
