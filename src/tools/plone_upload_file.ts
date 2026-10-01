import { z } from "zod";
import { buildUploadPayload } from "../dynamicPages/payloads";
import { localPath } from "../dynamicPages/paths";
import { getClient, runWith, textContent, type ToolDefinition } from "./shared";

export const ploneUploadFile: ToolDefinition = {
  name: "plone_upload_file",
  description:
    "Uploads an image or file to Plone from base64-encoded data, creating an Image or File object.",
  inputSchema: z.object({
    basePath: z
      .string()
      .describe("Path of the folder where the file is uploaded"),
    fileData: z.string().describe("Base64 encoded file data"),
    filename: z.string().describe("Filename of the uploaded file"),
    contentType: z
      .string()
      .optional()
      .describe(
        "MIME type of the uploaded file; defaults to application/octet-stream",
      ),
    title: z
      .string()
      .optional()
      .describe("Optional title; defaults to the filename"),
  }),
  handler: runWith("UploadFile", async (args, extra) => {
    const client = getClient(extra);
    const payload = buildUploadPayload({
      filename: args.filename,
      data: args.fileData,
      contentType: args.contentType || "application/octet-stream",
      title: args.title,
    });
    return textContent(await client.post(localPath(args.basePath), payload));
  }),
};
