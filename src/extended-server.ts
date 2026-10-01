import { createServer } from "./plone-mcp";
import { registerDynamicPagesTools } from "./tools/index";

export function createExtendedServer() {
  const server = createServer();
  registerDynamicPagesTools(server);
  return server;
}
