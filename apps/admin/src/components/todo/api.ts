import { api as adminApi, apiBlob } from "../../lib/api";

function todoPath(path: string) {
  if (path.startsWith("/customers")) return "/api/admin/tasks/customers";
  return `/api/admin${path}`;
}

export function api<T>(path: string, method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT" = "GET", body?: unknown): Promise<T> {
  return adminApi<T>(todoPath(path), {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
}

export async function todoBlob(path: string) {
  const { blob, filename } = await apiBlob(todoPath(path));
  return { blob, filename };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "bijlage";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
