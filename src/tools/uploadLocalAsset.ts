import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";
import * as fs from "fs/promises";
import * as path from "path";

function guessMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return types[ext] || "application/octet-stream";
}

export async function uploadLocalAsset(credentials: PloneCredentials, containerUrl: string, localPath: string) {
  const absolutePath = path.resolve(localPath);
  
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }

    const filename = path.basename(absolutePath);
    const mimeType = guessMimeType(filename);
    const data = await fs.readFile(absolutePath);
    const base64Data = data.toString("base64");

    const isImage = mimeType.startsWith("image/");
    const payload = {
      "@type": isImage ? "Image" : "File",
      "title": filename,
      [isImage ? "image" : "file"]: {
        "data": base64Data,
        "encoding": "base64",
        "content-type": mimeType,
        "filename": filename
      }
    };

    return fetchPlone(credentials, ensureApiUrl(containerUrl), {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (error: any) {
    throw new Error(`Error uploading local asset: ${error.message}`);
  }
}
