import { apiUrl } from "./api";
import type {
  CountCategory,
  CountList,
  CountSession,
  CountShift,
  CountStaffSessionUser,
  SaveCountSessionInput,
  TellingLoginResponse,
  TellingMeResponse
} from "@tresamigos/types";

const tokenKey = "tres_amigos_telling_token";
const listKey = "tres_amigos_telling_list";

export function getTellingToken() {
  return localStorage.getItem(tokenKey) || "";
}

export function setTellingToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearTellingToken() {
  localStorage.removeItem(tokenKey);
  sessionStorage.removeItem(listKey);
}

export function getTellingListId() {
  return sessionStorage.getItem(listKey) || "";
}

export function setTellingListId(listId: string) {
  sessionStorage.setItem(listKey, listId);
}

export function clearTellingListId() {
  sessionStorage.removeItem(listKey);
}

async function tellingApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getTellingToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(apiUrl(path), { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request mislukt.");
  return data as T;
}

export function loginTelling(loginNumber: string) {
  return tellingApi<TellingLoginResponse>("/api/telling/login", {
    method: "POST",
    body: JSON.stringify({ loginNumber })
  });
}

export function logoutTelling() {
  return tellingApi<{ message: string }>("/api/telling/logout", { method: "POST" });
}

export function fetchTellingMe() {
  return tellingApi<TellingMeResponse>("/api/telling/me");
}

export async function fetchTellingCatalog(listId: string) {
  const params = new URLSearchParams({ listId });
  const data = await tellingApi<{ categories: CountCategory[] }>(`/api/telling/catalog?${params}`);
  return data.categories;
}

export async function fetchCurrentCount(locationId: string, shift: CountShift, listId: string, countDate?: string) {
  const params = new URLSearchParams({ locationId, shift, listId });
  if (countDate) params.set("countDate", countDate);
  const data = await tellingApi<{ session: CountSession | null }>(`/api/telling/counts/current?${params}`);
  return data.session;
}

export function saveTellingCount(input: SaveCountSessionInput) {
  return tellingApi<CountSession>("/api/telling/counts", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function submitTellingCount(id: string) {
  return tellingApi<CountSession>(`/api/telling/counts/${id}/submit`, { method: "POST" });
}

export type { CountCategory, CountList, CountSession, CountShift, CountStaffSessionUser };
