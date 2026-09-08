import { createServer } from "@plone/mcp/dist/server.js";
import { registerDynamicPagesTools } from "./tools/registerDynamicPagesTools";

export function createExtendedServer() {
  const server = createServer();
  registerDynamicPagesTools(server);
  return server;
}
