// Single point of contact with @plone/mcp internals.
//
// Everything the extended server needs from the official package is
// re-exported here, so that a future public plugin API (or an internal
// path change) only requires touching this one file.
import { createServer } from "@plone/mcp/dist/server.js";
import { sessionManager } from "@plone/mcp/dist/session-manager.js";
import { wrapError } from "@plone/mcp/dist/utils/block-utils.js";

export { createServer, sessionManager, wrapError };
