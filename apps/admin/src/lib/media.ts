const API_BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "");

/** Volledige URL voor /assets/... previews in admin (via API-proxy). */
export function mediaAssetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
