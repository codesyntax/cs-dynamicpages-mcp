import type { JsonRecord } from "./payloads";
import { stripTrailingSlash } from "./paths";

interface SearchItem extends JsonRecord {
  "@id": string;
}

export function reassembleDynamicContent(
  pageData: JsonRecord,
  searchResults: JsonRecord[],
): JsonRecord {
  const rows: JsonRecord[] = [];
  const featuredByParent: Record<string, JsonRecord[]> = {};

  for (const item of searchResults) {
    if (item["@type"] === "DynamicPageRow") {
      rows.push(item);
    } else if (item["@type"] === "DynamicPageRowFeatured") {
      const parentUrl = splitParent(String(item["@id"]));
      if (!featuredByParent[parentUrl]) featuredByParent[parentUrl] = [];
      featuredByParent[parentUrl].push(item);
    }
  }

  const items = (pageData.items || []) as SearchItem[];
  const rowsFolderSummary = items.find((item) => item["@type"] === "DynamicPageFolder");

  const result = { ...pageData };

  if (rowsFolderSummary) {
    const rowsFolderId = stripTrailingSlash(String(rowsFolderSummary["@id"]));
    const pageRows = rows.filter((row) =>
      String(row["@id"]).startsWith(rowsFolderId),
    );

    const rowsItemsFull = pageRows.map((row) => {
      const rowId = stripTrailingSlash(String(row["@id"]));
      return {
        ...row,
        featured_items_full: featuredByParent[rowId] || [],
      };
    });

    result.dynamic_rows_folder_full = {
      "@id": rowsFolderSummary["@id"],
      "@type": "DynamicPageFolder",
      rows_items_full: rowsItemsFull,
    };
  }

  return result;
}

function splitParent(id: string): string {
  return id.split("/").slice(0, -1).join("/");
}
