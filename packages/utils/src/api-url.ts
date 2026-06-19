/**
 * Resolve VITE_API_URL for browser builds.
 * Production default: empty string → relative paths like /api/content.
 * Strips trailing slashes and a trailing /api segment to prevent /api/api/* URLs.
 */
export function resolveApiBase(raw?: string | null): string {
  if (raw == null || String(raw).trim() === "") {
    return "";
  }

  let base = String(raw).trim().replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  return base;
}

/** Build a full API URL from base + path (path must include /api/...). */
export function buildApiUrl(path: string, base: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Vite dev-server proxy target (never includes /api suffix). */
export function resolveDevApiTarget(raw?: string | null): string {
  const resolved = resolveApiBase(raw);
  return resolved || "http://localhost:3100";
}
