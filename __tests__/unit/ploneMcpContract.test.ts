import { describe, it, expect } from "vitest";
import { createServer, sessionManager, wrapError } from "../../src/plone-mcp";

/**
 * Guards the internal @plone/mcp surface that the extended server relies on.
 * If a version bump changes these exports, this test fails early with a clear
 * message instead of breaking at runtime.
 */
describe("@plone/mcp contract", () => {
  it("exposes the functions the extended server relies on", () => {
    expect(typeof createServer).toBe("function");
    expect(typeof wrapError).toBe("function");
    expect(typeof sessionManager.getSession).toBe("function");
  });

  it("createServer() returns an MCP server that can register tools", () => {
    const server = createServer();
    expect(typeof (server as unknown as { registerTool: unknown }).registerTool).toBe(
      "function",
    );
  });

  it("sessions expose getClient()", () => {
    const service = sessionManager.getSession("contract-test");
    expect(typeof service.getClient).toBe("function");
    sessionManager.clearSession("contract-test");
  });

  it("getClient() throws before plone_configure", () => {
    const service = sessionManager.getSession("contract-unconfigured");
    expect(() => service.getClient()).toThrow(/not configured/i);
    sessionManager.clearSession("contract-unconfigured");
  });
});
