export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Normalizes a user-supplied site path: root becomes '/', otherwise strips trailing slashes. */
export function normalizePath(p: string): string {
  if (!p || p === "/") return "/";
  return stripTrailingSlash(p);
}

/**
 * Converts a Plone object @id (absolute URL) into a site-relative path suitable
 * for the PloneClient, which expects paths relative to the ++api++ endpoint.
 */
export function localPath(id: string): string {
  if (!/^https?:\/\//.test(id)) return id;
  const afterApi = id.split("/++api++")[1];
  if (afterApi === undefined) return id;
  const trimmed = stripTrailingSlash(afterApi);
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
