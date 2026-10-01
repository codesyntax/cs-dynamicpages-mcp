import { z } from "zod";
import { buildUploadPayload, guessMimeType } from "../dynamicPages/payloads";
import { localPath } from "../dynamicPages/paths";
import { getClient, runWith, textContent, type ToolDefinition } from "./shared";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export const ploneUploadLocalAsset: ToolDefinition = {
  name: "plone_upload_local_asset",
  description:
    "Reads a file from the local filesystem and uploads it to Plone.",
  inputSchema: z.object({
    basePath: z
      .string()
      .describe("Path of the folder where the file is uploaded"),
    localPath: z
      .string()
      .describe("Absolute or relative path of the local file to upload"),
  }),
  handler: runWith("UploadLocalAsset", async (args, extra) => {
    const client = getClient(extra);
    const absolutePath = path.resolve(args.localPath);
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }
    const filename = path.basename(absolutePath);
    const contentType = guessMimeType(filename);
    const data = (await fs.readFile(absolutePath)).toString("base64");
    const payload = buildUploadPayload({ filename, data, contentType });
    return textContent(await client.post(localPath(args.basePath), payload));
  }),
};
