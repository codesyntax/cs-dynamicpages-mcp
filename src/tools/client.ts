import { PloneCredentials } from "../types";
import { ensureApiUrl, getHeaders } from "../utils";

export async function fetchPlone(credentials: PloneCredentials, path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith("http") ? path : `${ensureApiUrl(credentials.api_url)}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(credentials),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Plone API Error (${response.status}): ${text}`);
  }
  return response.json();
}
