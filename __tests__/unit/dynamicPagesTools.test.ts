import { describe, it, expect, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import {
  dynamicPagesTools,
  registerDynamicPagesTools,
} from "../../src/tools/registerDynamicPagesTools";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from "@modelcontextprotocol/sdk/types.js";

const EXPECTED_TOOL_NAMES = [
  "plone_get_site_definitions",
  "plone_get_dynamic_page_content",
  "plone_create_dynamic_page_row",
  "plone_create_dynamic_page_row_featured",
  "plone_move_dynamic_page_row",
  "plone_upload_file",
  "plone_upload_local_asset",
];

interface FakeClient {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function toolConfig(name: string) {
  const tool = dynamicPagesTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Missing dynamic pages tool: ${name}`);
  return tool;
}

/** Runs a test against a session with a fake PloneClient injected. */
function withClient(
  setup: (client: FakeClient) => void,
  fn: (sessionId: string, client: FakeClient) => Promise<void>,
) {
  return async () => {
    const sessionId = `test-${Math.random().toString(36).slice(2)}`;
    const service = sessionManager.getSession(sessionId);
    const client: FakeClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    service.client = client as any;
    setup(client);
    try {
      await fn(sessionId, client);
    } finally {
      sessionManager.clearSession(sessionId);
    }
  };
}

const extra = (sessionId: string): RequestHandlerExtra<ServerRequest, ServerNotification> =>
  ({ sessionId }) as unknown as RequestHandlerExtra<ServerRequest, ServerNotification>;

function textOf(result: CallToolResult) {
  return JSON.parse((result.content[0] as { type: "text"; text: string }).text);
}

describe("registerDynamicPagesTools", () => {
  it("registers exactly the seven dynamic pages tools", () => {
    const server = new McpServer({ name: "test", version: "0.0.1" });
    const spy = vi.spyOn(server, "registerTool");
    registerDynamicPagesTools(server);
    const names = spy.mock.calls.map((call) => String(call[0]));
    expect(names.sort()).toEqual([...EXPECTED_TOOL_NAMES].sort());
  });
});

describe("handler seam", () => {
  it("get_site_definitions fetches the three definition endpoints", withClient(
    (client) => {
      client.get.mockImplementation(async (path: string) => ({ "@id": path }));
    },
    async (sessionId) => {
      const result = await toolConfig("plone_get_site_definitions").handler(
        {},
        extra(sessionId),
      );
      const data = textOf(result);
      expect(data.DynamicPageRow["@id"]).toBe("/@types/DynamicPageRow");
      expect(data.DynamicPageRowFeatured["@id"]).toBe("/@types/DynamicPageRowFeatured");
      expect(data.RowTypes["@id"]).toBe(
        "/@registry/cs_dynamicpages.dynamic_pages_control_panel.row_type_fields",
      );
    },
  ));

  it("create_dynamic_page_row posts the row then each featured item to it", withClient(
    (client) => {
      client.post.mockImplementation(
        async (parentPath: string, payload: Record<string, unknown>) => ({
          "@id": `${parentPath === "/rows" ? "https://site/++api++/rows/hero" : `${parentPath}/${payload.title ?? "feat"}`}`,
          "@type": "DynamicPageRow",
          ...payload,
        }),
      );
    },
    async (sessionId) => {
      const result = await toolConfig("plone_create_dynamic_page_row").handler(
        {
          parentPath: "/rows",
          rowData: {
            row_type: "hero",
            title: "Hero",
            featured: [{ title: "C1" }, { title: "C2" }],
          },
        },
        extra(sessionId),
      );
      const client = sessionManager.getSession(sessionId).client as any;
      expect(client.post).toHaveBeenCalledTimes(3);
      expect(client.post).toHaveBeenNthCalledWith(1, "/rows", {
        "@type": "DynamicPageRow",
        title: "Hero",
        row_type: "hero",
      });
      // Featured items must be posted to a site-relative path (not the absolute @id)
      expect(client.post).toHaveBeenNthCalledWith(2, "/rows/hero", {
        "@type": "DynamicPageRowFeatured",
        title: "C1",
      });
      expect(client.post).toHaveBeenNthCalledWith(3, "/rows/hero", {
        "@type": "DynamicPageRowFeatured",
        title: "C2",
      });
      expect(textOf(result)["@id"]).toBe("https://site/++api++/rows/hero");
    },
  ));

  it("get_dynamic_page_content fetches the page + rows and reassembles the hierarchy", withClient(
    (client) => {
      client.get.mockImplementation(async (path: string, params?: Record<string, unknown>) => {
        if (path === "/en/home") {
          return {
            "@type": "DynamicPage",
            title: "Home",
            items: [
              { "@id": "https://site/++api++/en/home/rows", "@type": "DynamicPageFolder" },
            ],
          };
        }
        if (path === "/@search") {
          expect(params?.path).toBe("/en/home");
          return {
            items: [
              { "@id": "https://site/++api++/en/home/rows/row-a", "@type": "DynamicPageRow" },
              {
                "@id": "https://site/++api++/en/home/rows/row-a/item",
                "@type": "DynamicPageRowFeatured",
                title: "Item",
              },
            ],
          };
        }
        throw new Error(`Unexpected get: ${path}`);
      });
    },
    async (sessionId) => {
      const result = await toolConfig("plone_get_dynamic_page_content").handler(
        { path: "/en/home" },
        extra(sessionId),
      );
      const data = textOf(result);
      expect(data.dynamic_rows_folder_full.rows_items_full).toEqual([
        {
          "@id": "https://site/++api++/en/home/rows/row-a",
          "@type": "DynamicPageRow",
          featured_items_full: [
            {
              "@id": "https://site/++api++/en/home/rows/row-a/item",
              "@type": "DynamicPageRowFeatured",
              title: "Item",
            },
          ],
        },
      ]);
    },
  ));

  it("normalizes full ++api++ URLs supplied as path arguments", withClient(
    (client) => {
      client.post.mockImplementation(async (p: string, payload: Record<string, unknown>) => ({
        "@id": `https://site/++api++${p}/row-1`,
        ...payload,
      }));
      client.get.mockResolvedValue({ items: [{ "@id": "https://site/++api++/rows/row-a" }] });
      client.patch.mockResolvedValue({});
    },
    async (sessionId, client) => {
      await toolConfig("plone_create_dynamic_page_row").handler(
        {
          parentPath: "https://example.com/site/++api++/rows",
          rowData: { row_type: "hero" },
        },
        extra(sessionId),
      );
      expect(client.post).toHaveBeenCalledWith("/rows", {
        "@type": "DynamicPageRow",
        title: "New Row",
        row_type: "hero",
      });

      await toolConfig("plone_move_dynamic_page_row").handler(
        {
          folderPath: "https://example.com/site/++api++/rows",
          rowId: "row-a",
          position: "1",
        },
        extra(sessionId),
      );
      expect(client.get).toHaveBeenCalledWith("/rows");
      expect(client.patch).toHaveBeenCalledWith("/rows", {
        ordering: { obj_id: "row-a", delta: 1 },
      });
    },
  ));

  it("move_dynamic_page_row patches the folder with the computed ordering", withClient(
    (client) => {
      client.get.mockResolvedValue({
        items: [
          { "@id": "https://site/++api++/rows/row-a" },
          { "@id": "https://site/++api++/rows/row-b" },
        ],
      });
      client.patch.mockResolvedValue({});
    },
    async (sessionId, client) => {
      await toolConfig("plone_move_dynamic_page_row").handler(
        { folderPath: "/rows", rowId: "row-a", position: "1" },
        extra(sessionId),
      );
      expect(client.patch).toHaveBeenCalledWith("/rows", {
        ordering: { obj_id: "row-a", delta: 1 },
      });
    },
  ));

  it("upload_file posts an Image payload from base64 data", withClient(
    (client) => {
      client.post.mockResolvedValue({ "@id": "/images/hero", "@type": "Image" });
    },
    async (sessionId, client) => {
      await toolConfig("plone_upload_file").handler(
        {
          basePath: "/images",
          fileData: "aGVsbG8=",
          filename: "hero.png",
          contentType: "image/png",
          title: "Hero",
        },
        extra(sessionId),
      );
      expect(client.post).toHaveBeenCalledWith("/images", {
        "@type": "Image",
        title: "Hero",
        image: {
          data: "aGVsbG8=",
          encoding: "base64",
          "content-type": "image/png",
          filename: "hero.png",
        },
      });
    },
  ));

  it("throws a wrapped 'not configured' error when no client exists", async () => {
    await expect(
      toolConfig("plone_get_site_definitions").handler({}, extra("no-such-session")),
    ).rejects.toThrow(/Plone client not configured/);
  });
});