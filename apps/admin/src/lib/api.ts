const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
const tokenKey = "tres_amigos_admin_token";

export function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

export function setToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearToken() {
  localStorage.removeItem(tokenKey);
}

function apiUrl(path: string) {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(apiUrl(path), { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request mislukt.");
  return data as T;
}

export async function login(password: string) {
  return api<{ token: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}
