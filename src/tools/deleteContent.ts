import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function deleteContent(credentials: PloneCredentials, url: string) {
  return fetchPlone(credentials, ensureApiUrl(url), { method: "DELETE" });
}
