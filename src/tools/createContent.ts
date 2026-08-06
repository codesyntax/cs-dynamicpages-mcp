import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function createContent(credentials: PloneCredentials, containerUrl: string, contentType: string, data: any) {
  const payload = {
    "@type": contentType,
    ...data
  };

  return fetchPlone(credentials, ensureApiUrl(containerUrl), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
