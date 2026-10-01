import type { JsonRecord } from "./payloads";
import { stripTrailingSlash } from "./paths";

export function rowShortName(rowId: string): string {
  // Accept short ids ("row-a"), full URLs and site-relative paths
  // ("/rows/row-a"): in every case the short name is the last path segment.
  const trimmed = stripTrailingSlash(rowId);
  if (!trimmed.includes("/")) return trimmed;
  return trimmed.split("/").pop() || trimmed;
}

export function computeOrderingPayload(
  folderItems: JsonRecord[],
  rowId: string,
  position: string,
): JsonRecord {
  const objId = rowShortName(rowId);

  if (Number.isNaN(Number(position))) {
    return { ordering: { obj_id: objId, delta: position } };
  }

  const currentPos = folderItems.findIndex(
    (item) => rowShortName(String(item["@id"])) === objId,
  );
  if (currentPos === -1) {
    throw new Error("Row not found in folder");
  }

  // `delta` is relative; `position` is a 1-based target and `currentPos` is a
  // 0-based index, hence the extra -1.
  return {
    ordering: { obj_id: objId, delta: Number(position) - 1 - currentPos },
  };
}
