import { assetUrl } from "../api";

/** Zorgt dat catering-afbeeldingen altijd via /assets/... laden (ook uploads op /catering). */
export function cateringImageUrl(path?: string) {
  if (!path) return "";
  return assetUrl(path.replace(/^\/+/, ""));
}
