import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function getDynamicPageContent(credentials: PloneCredentials, pageUrl: string) {
  const apiUrl = ensureApiUrl(pageUrl);
  const pageData = await fetchPlone(credentials, `${apiUrl}?b_size=1000`);
  
  const searchPath = new URL(apiUrl).pathname.replace("/++api++", "");
  const baseApiUrl = apiUrl.split("/++api++")[0];
  
  const searchUrl = `${ensureApiUrl(baseApiUrl)}/@search?path=${searchPath}&portal_type=DynamicPageRow&portal_type=DynamicPageRowFeatured&fullobjects=1&metadata_fields=portal_type&sort_on=getObjPositionInParent&b_size=1000`;
  
  const searchResp = await fetchPlone(credentials, searchUrl);
  const searchResults = searchResp.items || [];

  const rows: any[] = [];
  const featuredByParent: Record<string, any[]> = {};

  for (const item of searchResults) {
    if (item["@type"] === "DynamicPageRow") {
      rows.push(item);
    } else if (item["@type"] === "DynamicPageRowFeatured") {
      const parentUrl = item["@id"].split("/").slice(0, -1).join("/");
      if (!featuredByParent[parentUrl]) featuredByParent[parentUrl] = [];
      featuredByParent[parentUrl].push(item);
    }
  }

  const items = pageData.items || [];
  const rowsFolderSummary = items.find((item: any) => item["@type"] === "DynamicPageFolder");
  
  if (rowsFolderSummary) {
    const rowsFolderId = rowsFolderSummary["@id"].replace(/\/$/, "");
    const pageRows = rows.filter(r => r["@id"].startsWith(rowsFolderId));
    
    for (const row of pageRows) {
      const rowId = row["@id"].replace(/\/$/, "");
      row.featured_items_full = featuredByParent[rowId] || [];
    }

    pageData.dynamic_rows_folder_full = {
      "@id": rowsFolderSummary["@id"],
      "@type": "DynamicPageFolder",
      "rows_items_full": pageRows
    };
  }

  return pageData;
}
