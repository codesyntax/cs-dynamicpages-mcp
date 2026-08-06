import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";

export async function getSiteDefinitions(credentials: PloneCredentials) {
  const registryKey = "cs_dynamicpages.dynamic_pages_control_panel.row_type_fields";
  const [rowSchema, featSchema, rowTypes] = await Promise.all([
    fetchPlone(credentials, "/@types/DynamicPageRow"),
    fetchPlone(credentials, "/@types/DynamicPageRowFeatured"),
    fetchPlone(credentials, `/@registry/${registryKey}`)
  ]);

  return {
    DynamicPageRow: rowSchema,
    DynamicPageRowFeatured: featSchema,
    RowTypes: rowTypes
  };
}
