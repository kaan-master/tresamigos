import { buildApiUrl, resolveApiBase } from "@tresamigos/utils/api-url";

const API_BASE = import.meta.env.DEV ? "" : resolveApiBase(import.meta.env.VITE_API_URL);

/** Encode path segments so `#`, spaties en emoji geen 404/hash in de browser worden. */
export function encodeAssetPath(path: string) {
  const [pathname, query] = path.split("?");
  const encoded = pathname
    .split("/")
    .map((segment, index) => (index === 0 && segment === "" ? "" : encodeURIComponent(segment)))
    .join("/");
  return query ? `${encoded}?${query}` : encoded;
}

/** Volledige URL voor /assets/... previews in admin (via API-proxy in dev, relatief in prod). */
export function mediaAssetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return buildApiUrl(encodeAssetPath(normalized), API_BASE);
}
