import { PloneCredentials } from "./types";

/**
 * Ensures the URL is a Plone REST API URL.
 * - Injects ++api++ if missing.
 * - Strips trailing slashes.
 */
export function ensureApiUrl(url: string): string {
  if (!url) return "";
  
  let targetUrl = url.replace(/\/+$/, "");
  
  if (targetUrl.includes("++api++")) {
    return targetUrl;
  }
  
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname) return targetUrl;
    
    let path = parsed.pathname === "/" ? "" : parsed.pathname;
    if (!path.startsWith("/++api++")) {
      parsed.pathname = "/++api++" + path;
    }
    
    return parsed.toString().replace(/\/+$/, "");
  } catch (e) {
    return targetUrl;
  }
}

/**
 * Constructs Plone API headers.
 */
export function getHeaders(credentials: Partial<PloneCredentials>): Record<string, string> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };
  
  if (credentials.token) {
    headers["Authorization"] = `Bearer ${credentials.token}`;
  } else if (credentials.cookie) {
    headers["Cookie"] = `__ac=${credentials.cookie}`;
  }
  
  return headers;
}
