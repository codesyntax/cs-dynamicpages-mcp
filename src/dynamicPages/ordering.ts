import type { JsonRecord } from "./payloads";
import { stripTrailingSlash } from "./paths";

export function rowShortName(rowId: string): string {
  if (!rowId.includes("://")) return rowId;
  return stripTrailingSlash(rowId).split("/").pop()!;
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

  return {
    ordering: { obj_id: objId, delta: Number(position) - currentPos },
  };
}
