// Single point of contact with @plone/mcp internals.
//
// Everything the extended server needs from the official package is
// re-exported here, so that a future public plugin API (or an internal
// path change) only requires touching this one file.
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "@plone/mcp/dist/server.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import { wrapError } from "@plone/mcp/dist/utils/block-utils.js";
import type { PloneClient } from "@plone/mcp/dist/plone-client.js";

export { createServer, sessionManager, wrapError };
export type { PloneClient };

export type Extra = RequestHandlerExtra<ServerRequest, ServerNotification>;

/** Returns the Plone client of the current session. Throws when not configured. */
export function getClient(extra: Extra): PloneClient {
  const sessionId = extra.sessionId || "default";
  return sessionManager.getSession(sessionId).getClient();
}

/**
 * Returns the Plone client of the current session, or null when
 * plone_configure has not run yet. Used by resources, which cannot signal
 * errors with an `isError` flag and therefore prefer a graceful fallback.
 */
export function tryGetClient(extra: Extra): PloneClient | null {
  const sessionId = extra.sessionId || "default";
  try {
    return sessionManager.getSession(sessionId).getClient();
  } catch {
    return null;
  }
}
