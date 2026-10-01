import { build } from "esbuild";

/**
 * Bundles the local stdio entrypoint into a single ESM file.
 *
 * `packages: "external"` keeps @plone/mcp, @modelcontextprotocol/sdk and zod as
 * runtime imports resolved from node_modules, so only this project's source is
 * bundled. This sidesteps Node ESM's requirement for explicit `.js` extensions
 * in relative imports and produces a dependency-free artefact in dist/.
 */
await build({
  entryPoints: ["src/local.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  sourcemap: true,
  outfile: "dist/local.js",
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
});
