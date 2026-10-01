import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import {
  dynamicPagesResources,
  registerDynamicPagesResources,
} from "../../src/resources/index";
import type { Extra } from "../../src/plone-mcp";

const EXPECTED_RESOURCE_NAMES = [
  "cs-dynamicpages-architecture",
  "cs-dynamicpages-migration",
  "cs-dynamicpages-row-types",
  "cs-dynamicpages-row-schema",
  "cs-dynamicpages-row-featured-schema",
];

function resource(name: string) {
  const found = dynamicPagesResources.find((r) => r.name === name);
  if (!found) throw new Error(`Missing resource: ${name}`);
  return found;
}

const extra = (sessionId?: string): Extra =>
  ({ sessionId }) as unknown as Extra;

function firstContent(result: unknown) {
  return (result as { contents: Array<{ mimeType?: string; text: string }> })
    .contents[0];
}

describe("registerDynamicPagesResources", () => {
  it("registers exactly the five dynamic pages resources", () => {
    const server = new McpServer({ name: "test", version: "0.0.1" });
    const spy = vi.spyOn(server, "registerResource");
    registerDynamicPagesResources(server);
    const names = spy.mock.calls.map((call) => String(call[0]));
    expect(names.sort()).toEqual([...EXPECTED_RESOURCE_NAMES].sort());
  });
});

describe("resource handlers", () => {
  it("serves the documentation markdown without a connection", async () => {
    const cases = [
      ["cs-dynamicpages-architecture", "cs-dynamicpages://docs/architecture", "Architecture"],
      ["cs-dynamicpages-migration", "cs-dynamicpages://docs/migration", "Migration"],
    ] as const;

    for (const [name, uri, needle] of cases) {
      const result = await resource(name).handler(new URL(uri), extra());
      const content = firstContent(result);
      expect(content.mimeType).toBe("text/markdown");
      expect(content.text).toContain(needle);
    }
  });

  it("returns actionable guidance when plone_configure has not run", async () => {
    const cases = [
      ["cs-dynamicpages-row-types", "cs-dynamicpages://row-types"],
      ["cs-dynamicpages-row-schema", "cs-dynamicpages://schemas/row"],
      ["cs-dynamicpages-row-featured-schema", "cs-dynamicpages://schemas/row-featured"],
    ] as const;

    for (const [name, uri] of cases) {
      const sessionId = `unconfigured-${name}`;
      sessionManager.clearSession(sessionId);
      const result = await resource(name).handler(new URL(uri), extra(sessionId));
      const content = firstContent(result);
      expect(content.mimeType).toBe("text/markdown");
      expect(content.text).toMatch(/plone_configure/);
      sessionManager.clearSession(sessionId);
    }
  });

  it("returns JSON from the configured client", async () => {
    const sessionId = `configured-${Math.random().toString(36).slice(2)}`;
    const service = sessionManager.getSession(sessionId);
    const client = { get: vi.fn(async (path: string) => ({ path })) };
    service.client = client as never;

    try {
      const rowTypes = await resource("cs-dynamicpages-row-types").handler(
        new URL("cs-dynamicpages://row-types"),
        extra(sessionId),
      );
      expect(JSON.parse(firstContent(rowTypes).text)).toEqual({
        path: "/@registry/cs_dynamicpages.dynamic_pages_control_panel.row_type_fields",
      });

      const rowSchema = await resource("cs-dynamicpages-row-schema").handler(
        new URL("cs-dynamicpages://schemas/row"),
        extra(sessionId),
      );
      expect(JSON.parse(firstContent(rowSchema).text)).toEqual({
        path: "/@types/DynamicPageRow",
      });

      const featSchema = await resource(
        "cs-dynamicpages-row-featured-schema",
      ).handler(new URL("cs-dynamicpages://schemas/row-featured"), extra(sessionId));
      expect(JSON.parse(firstContent(featSchema).text)).toEqual({
        path: "/@types/DynamicPageRowFeatured",
      });
    } finally {
      sessionManager.clearSession(sessionId);
    }
  });
});
