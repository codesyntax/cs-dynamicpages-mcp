import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function uploadAsset(credentials: PloneCredentials, containerUrl: string, file: { data: string, filename: string, contentType: string, title?: string }) {
  const isImage = file.contentType.startsWith("image/");
  const payload = {
    "@type": isImage ? "Image" : "File",
    "title": file.title || file.filename,
    [isImage ? "image" : "file"]: {
      "data": file.data,
      "encoding": "base64",
      "content-type": file.contentType,
      "filename": file.filename
    }
  };

  return fetchPlone(credentials, ensureApiUrl(containerUrl), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
