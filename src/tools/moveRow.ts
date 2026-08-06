import { PloneCredentials } from "../types";
import { fetchPlone } from "./client";
import { ensureApiUrl } from "../utils";

export async function moveRow(credentials: PloneCredentials, folderUrl: string, rowId: string, position: string) {
  const apiUrl = ensureApiUrl(folderUrl);
  const actualId = rowId.includes("://") ? rowId.replace(/\/$/, "").split("/").pop()! : rowId;
  
  let payload;
  if (!isNaN(Number(position))) {
    const folder = await fetchPlone(credentials, apiUrl);
    const items = folder.items || [];
    const currentPos = items.findIndex((i: any) => i["@id"].split("/").pop() === actualId);
    if (currentPos === -1) throw new Error("Row not found in folder");
    payload = { ordering: { obj_id: actualId, delta: Number(position) - currentPos } };
  } else {
    payload = { ordering: { obj_id: actualId, delta: position } };
  }

  return fetchPlone(credentials, apiUrl, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
