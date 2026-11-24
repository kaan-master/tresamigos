import { apiUrl } from "./api";
import type {
  FranchiseShopCatalogProduct,
  FranchiseShopLoginResponse,
  FranchiseShopOrder,
  FranchiseShopPaymentMethod,
  FranchiseShopPaymentStatus,
  FranchiseShopSessionUser
} from "@tresamigos/types";

const tokenKey = "tres_amigos_franchise_shop_token";

export function getFranchiseToken() {
  return localStorage.getItem(tokenKey) || "";
}

export function setFranchiseToken(token: string) {
  localStorage.setItem(tokenKey, token);
}

export function clearFranchiseToken() {
  localStorage.removeItem(tokenKey);
}

async function franchiseApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getFranchiseToken();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    }
  });
  const data = (await response.json().catch(() => ({}))) as T & { message?: unknown; error?: unknown };
  if (!response.ok) {
    const message = data.message;
    let text = "Er ging iets mis.";
    if (typeof message === "string") {
      text = message;
    } else if (Array.isArray(message)) {
      text = message.map(String).filter(Boolean).join(" ");
    } else if (message && typeof message === "object" && "message" in message) {
      const nested = (message as { message: unknown }).message;
      if (typeof nested === "string") text = nested;
    } else if (typeof data.error === "string" && data.error !== "Internal Server Error") {
      text = data.error;
    }
    if (/internal server error/i.test(text)) {
      text = "Bestelling mislukt door een serverfout. Controleer of de database-migraties zijn gedraaid.";
    }
    throw new Error(text);
  }
  return data;
}

export function loginFranchise(email: string, password: string) {
  return franchiseApi<FranchiseShopLoginResponse>("/api/franchise/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function fetchFranchiseMe() {
  return franchiseApi<{ user: FranchiseShopSessionUser }>("/api/franchise/me");
}

export function logoutFranchise() {
  return franchiseApi<{ message: string }>("/api/franchise/logout", { method: "POST" }).finally(() => {
    clearFranchiseToken();
  });
}

export function fetchFranchiseCatalog() {
  return franchiseApi<{ products: FranchiseShopCatalogProduct[] }>("/api/franchise/shop/catalog");
}

export function placeFranchiseOrder(
  items: Array<{ productId: string; quantity: number }>,
  notes?: string,
  paymentMethod?: FranchiseShopPaymentMethod
) {
  return franchiseApi<{ order: FranchiseShopOrder; message: string; checkoutUrl?: string | null }>(
    "/api/franchise/shop/orders",
    {
      method: "POST",
      body: JSON.stringify({ items, notes, paymentMethod })
    }
  );
}

export function fetchFranchiseOrders() {
  return franchiseApi<{ orders: FranchiseShopOrder[] }>("/api/franchise/shop/orders");
}

export function fetchFranchisePaymentStatus(params: { orderId?: string; paymentId?: string }) {
  const query = new URLSearchParams();
  if (params.orderId) query.set("orderId", params.orderId);
  if (params.paymentId) query.set("paymentId", params.paymentId);
  return franchiseApi<{
    order: FranchiseShopOrder;
    paymentId: string;
    status: FranchiseShopPaymentStatus | string;
    settled: boolean;
  }>(`/api/payments/mollie/status?${query.toString()}`);
}

export async function downloadFranchisePdf(path: string, filename: string) {
  const token = getFranchiseToken();
  const response = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Download mislukt.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
