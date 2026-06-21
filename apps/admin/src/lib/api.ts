import { buildApiUrl, resolveApiBase } from "@tresamigos/utils/api-url";
import type {
  AdminLoginResponse,
  AdminSessionUser,
  AdminUserRecord,
  CreateAdminUserInput,
  UpdateAdminUserInput
} from "@tresamigos/types";

const base = import.meta.env.DEV ? "" : resolveApiBase(import.meta.env.VITE_API_URL);
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
  return buildApiUrl(path, base);
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

export async function login(email: string, password: string) {
  return api<AdminLoginResponse>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() || undefined, password })
  });
}

export async function fetchMe() {
  return api<{ user: AdminSessionUser }>("/api/admin/me");
}

export async function logoutApi() {
  return api<{ message: string }>("/api/admin/logout", { method: "POST" });
}

export async function listAdminUsers() {
  return api<{ users: AdminUserRecord[] }>("/api/admin/users");
}

export async function createAdminUser(input: CreateAdminUserInput) {
  return api<{ user: AdminUserRecord; message: string }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput) {
  return api<{ user: AdminUserRecord; message: string }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteAdminUser(id: string) {
  return api<{ message: string }>(`/api/admin/users/${id}`, { method: "DELETE" });
}

export async function uploadMedia(file: File) {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body = new FormData();
  body.append("file", file);

  const response = await fetch(apiUrl("/api/admin/media/upload"), {
    method: "POST",
    headers,
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Upload mislukt.");
  return data as { asset: { url: string; filename: string }; message: string };
}

export async function deleteMedia(url: string) {
  return api<{ message: string }>("/api/admin/media", {
    method: "DELETE",
    body: JSON.stringify({ url })
  });
}

export async function listMedia() {
  return api<{ assets: import("@tresamigos/types").MediaAsset[] }>("/api/admin/media");
}
