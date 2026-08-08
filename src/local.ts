import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createExtendedServer } from "./extended-server";

async function main() {
  const server = createExtendedServer();
  const transport = new StdioServerTransport();

  console.error("Plone MCP server (extended with dynamic pages tools) starting on stdio...");

  await server.connect(transport);

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
