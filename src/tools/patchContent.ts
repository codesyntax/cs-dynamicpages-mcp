import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function patchContent(credentials: PloneCredentials, url: string, data: Record<string, any>) {
  const apiUrl = ensureApiUrl(url);
  const current = await fetchPlone(credentials, apiUrl);
  const changes: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (current[key] !== value) {
      changes[key] = value;
    }
  }

  if (Object.keys(changes).length === 0) return "No changes detected";

  return fetchPlone(credentials, apiUrl, {
    method: "PATCH",
    body: JSON.stringify(changes)
  });
}
