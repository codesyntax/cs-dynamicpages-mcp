import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";

export async function searchContent(credentials: PloneCredentials, query?: string, portalType?: string, path?: string, limit: number = 100) {
  const params = new URLSearchParams();
  params.append("metadata_fields", "portal_type");
  params.append("metadata_fields", "review_state");
  params.append("b_size", limit.toString());
  
  if (query) params.append("SearchableText", query);
  if (portalType) params.append("portal_type", portalType);
  if (path) params.append("path", path);

  const results = await fetchPlone(credentials, `/@search?${params.toString()}`);
  return (results.items || []).map((item: any) => ({
    title: item.title,
    "@id": item["@id"],
    type: item.portal_type,
    state: item.review_state
  }));
}
