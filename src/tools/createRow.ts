import { PloneCredentials, DynamicPageRowData, FeaturedItemData } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function createFeatured(credentials: PloneCredentials, parentRowUrl: string, featData: FeaturedItemData) {
  const payload = {
    "@type": "DynamicPageRowFeatured",
    "title": featData.title || "Featured Item",
    ...(featData.fields || {})
  };

  return fetchPlone(credentials, ensureApiUrl(parentRowUrl), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createRow(credentials: PloneCredentials, folderUrl: string, rowData: DynamicPageRowData) {
  const payload = {
    "@type": "DynamicPageRow",
    "title": rowData.title || "New Row",
    "row_type": rowData.row_type,
    ...(rowData.fields || {})
  };

  const row = await fetchPlone(credentials, ensureApiUrl(folderUrl), {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (rowData.featured && rowData.featured.length > 0) {
    for (const feat of rowData.featured) {
      await createFeatured(credentials, row["@id"], feat);
    }
  }

  return row;
}
