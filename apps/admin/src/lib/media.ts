import { buildApiUrl, resolveApiBase } from "@tresamigos/utils/api-url";

const API_BASE = import.meta.env.DEV ? "" : resolveApiBase(import.meta.env.VITE_API_URL);

/** Volledige URL voor /assets/... previews in admin (via API-proxy in dev, relatief in prod). */
export function mediaAssetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return buildApiUrl(normalized, API_BASE);
}
