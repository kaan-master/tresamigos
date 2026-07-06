import type { CateringSettings } from "@tresamigos/types";
import { api } from "./api";

export async function saveCateringSettings(settings: CateringSettings) {
  return api<CateringSettings>("/api/admin/catering/settings", {
    method: "PUT",
    body: JSON.stringify(settings)
  });
}
