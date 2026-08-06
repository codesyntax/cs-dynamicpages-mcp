import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server";

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  
  console.error("Plone Dynamic Pages MCP server (v2.0.0) starting on stdio...");
  
  await server.connect(transport);
  
  // Keep the process alive
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
