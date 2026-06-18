const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export function apiUrl(path: string) {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchContent() {
  const response = await fetch(apiUrl("/api/content"));
  if (!response.ok) throw new Error("Content kon niet geladen worden.");
  return response.json();
}

export async function submitApplication(body: unknown) {
  const response = await fetch(apiUrl("/api/applications"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Verzenden mislukt.");
  return data;
}

export function assetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return apiUrl(path.startsWith("/") ? path : `/${path}`);
}

export function pageUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("mailto:")) {
    return path;
  }
  if (path.endsWith(".html")) {
    return path.replace(".html", "").replace("index", "/") || "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}
