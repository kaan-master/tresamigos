import { Injectable, Logger } from "@nestjs/common";
import type { MollieMode } from "@tresamigos/types";
import { PrismaService } from "../prisma/prisma.module";

const PRIMARY_ID = "primary";
const MOLLIE_API = "https://api.mollie.com/v2";

export type MollieKeyKind = "test" | "live";
export type MolliePaymentMethod = "ideal";
export type MolliePaymentStatus = "paid" | "open" | "pending" | "failed" | "canceled" | "expired";

export class MollieServiceError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(translateMollieErrorMessage(message));
    this.name = "MollieServiceError";
    this.status = status;
  }
}

export function translateMollieErrorMessage(message: string) {
  const normalized = message.trim();
  const lower = normalized.toLowerCase();
  if (lower.includes("payment method is not active")) {
    return "Deze betaalmethode staat niet aan in je Mollie-profiel. Activeer iDEAL in Mollie.";
  }
  if (lower.includes("webhook") && lower.includes("valid")) {
    return "De Mollie webhook-URL is ongeldig. Gebruik een publiek bereikbare HTTPS-URL.";
  }
  if (lower.includes("redirect") && lower.includes("valid")) {
    return "De Mollie return-URL is ongeldig. Controleer FRONTEND_URL / PUBLIC_WEB_URL.";
  }
  return normalized || "Mollie-verzoek is mislukt.";
}

type MollieApiPayment = {
  id: string;
  status: string;
  description?: string;
  amount?: { currency?: string; value?: string };
  metadata?: Record<string, unknown> | string | null;
  method?: string | null;
  _links?: { checkout?: { href?: string } };
};

export type MolliePaymentDetails = {
  paymentId: string;
  status: MolliePaymentStatus;
  description: string;
  method: string;
  amount: { currency: string; value: string } | null;
  metadata: Record<string, string>;
};

@Injectable()
export class MollieService {
  private readonly logger = new Logger(MollieService.name);

  constructor(private readonly prisma: PrismaService) {}

  normalizeMode(value: unknown): MollieMode {
    return value === "live" ? "live" : "test";
  }

  validateKey(value: string, kind: MollieKeyKind) {
    const key = value.trim();
    if (!key) return "";
    const prefix = kind === "live" ? "live_" : "test_";
    if (!key.startsWith(prefix) || key.length < 12) {
      throw new Error(
        kind === "live"
          ? "Live-sleutel moet met live_ beginnen (van dashboard.mollie.com)."
          : "Test-sleutel moet met test_ beginnen (van dashboard.mollie.com)."
      );
    }
    return key;
  }

  maskKey(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.length <= 10) return `${trimmed.slice(0, 5)}••••`;
    return `${trimmed.slice(0, 8)}••••${trimmed.slice(-4)}`;
  }

  private publicApiBase() {
    return String(process.env.API_PUBLIC_URL || process.env.PUBLIC_API_URL || "https://tresamigos.nl")
      .trim()
      .replace(/\/$/, "");
  }

  private publicWebBase() {
    return String(process.env.FRONTEND_URL || process.env.PUBLIC_WEB_URL || "https://tresamigos.nl")
      .trim()
      .replace(/\/$/, "");
  }

  endpointUrls() {
    const base = this.publicApiBase();
    return {
      webhookUrl: `${base}/api/payments/mollie/webhook`,
      createPaymentUrl: `${base}/api/payments/mollie/create`,
      statusUrl: `${base}/api/payments/mollie/status`
    };
  }

  buildFranchiseRedirectUrl(orderId: string) {
    const url = new URL("/franchise/shop", `${this.publicWebBase()}/`);
    url.searchParams.set("orderId", orderId);
    url.searchParams.set("payment", "return");
    return url.toString();
  }

  resolveWebhookUrl(stored?: string | null) {
    const candidates = [this.endpointUrls().webhookUrl, stored];
    for (const candidate of candidates) {
      const value = String(candidate || "").trim();
      if (!value) continue;
      try {
        const url = new URL(value);
        if (!url.pathname.includes("/api/payments/mollie/webhook")) continue;
        if (url.protocol === "https:") return value;
        if (process.env.NODE_ENV !== "production" && url.protocol === "http:") return value;
      } catch {
        /* skip */
      }
    }
    return "";
  }

  async getRow() {
    return this.prisma.integrationSettings.findUnique({ where: { id: PRIMARY_ID } });
  }

  async resolveActiveApiKey(): Promise<{ key: string; mode: MollieMode } | null> {
    const row = await this.getRow();
    if (!row?.mollieEnabled) return null;
    const preferred = this.normalizeMode(row.mollieMode);
    const preferredKey = preferred === "live" ? row.mollieLiveApiKey : row.mollieTestApiKey;
    if (preferredKey?.trim()) return { key: preferredKey.trim(), mode: preferred };

    // Alleen de andere sleutel aanwezig? Gebruik die (test-only setup werkt zo zonder live key).
    const fallbackMode: MollieMode = preferred === "live" ? "test" : "live";
    const fallbackKey = fallbackMode === "live" ? row.mollieLiveApiKey : row.mollieTestApiKey;
    if (fallbackKey?.trim()) return { key: fallbackKey.trim(), mode: fallbackMode };
    return null;
  }

  async assertActiveApiKey() {
    const resolved = await this.resolveActiveApiKey();
    if (!resolved) {
      throw new MollieServiceError(
        "Mollie is niet actief of er ontbreekt een API-sleutel. Vul een test_... sleutel in en zet testmodus aan.",
        503
      );
    }
    return resolved;
  }

  mollieAmountValue(totalCents: number) {
    return (Math.max(0, totalCents) / 100).toFixed(2);
  }

  amountsMatch(totalCents: number, amount?: { currency?: string; value?: string } | null) {
    return amount?.currency === "EUR" && amount.value === this.mollieAmountValue(totalCents);
  }

  normalizeStatus(status: string): MolliePaymentStatus {
    switch (status) {
      case "paid":
        return "paid";
      case "pending":
        return "pending";
      case "failed":
        return "failed";
      case "canceled":
        return "canceled";
      case "expired":
        return "expired";
      default:
        return "open";
    }
  }

  private readMetadata(metadata: MollieApiPayment["metadata"]) {
    if (!metadata || typeof metadata === "string") return {};
    return Object.fromEntries(
      Object.entries(metadata)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
        .map(([key, value]) => [key, value.trim()])
    );
  }

  private async mollieRequest<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${MOLLIE_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers || {})
      }
    });
    const payload = (await response.json().catch(() => ({}))) as {
      detail?: string;
      title?: string;
      status?: number;
    } & T;
    if (!response.ok) {
      const message = payload.detail || payload.title || `Mollie gaf status ${response.status}.`;
      throw new MollieServiceError(message, response.status);
    }
    return payload;
  }

  async ping(apiKey: string) {
    const key = apiKey.trim();
    const mode: MollieMode = key.startsWith("live_") ? "live" : "test";
    try {
      // Belangrijk: /organizations/me is live-only en faalt met test_… sleutels.
      // /methods werkt in test én live.
      const data = await this.mollieRequest<{
        count?: number;
        _embedded?: { methods?: Array<{ id?: string }> };
      }>(key, "/methods");
      const methods = data._embedded?.methods || [];
      const ideal = methods.some((method) => method.id === "ideal");
      return {
        ok: true as const,
        message: `Verbonden met Mollie (${mode})${ideal ? " · iDEAL beschikbaar" : ""}.`,
        profileId: ""
      };
    } catch (error) {
      let message = error instanceof Error ? error.message : "Mollie ping mislukt.";
      if (/only available in live mode/i.test(message) && mode === "test") {
        message =
          "Mollie weigerde een live-only API met je test-sleutel. Sla op, herstart/deploy de API, en test opnieuw — de check gebruikt nu /methods (werkt wél in testmodus).";
      }
      this.logger.warn(`Mollie ping mislukt (${mode}): ${message}`);
      return { ok: false as const, message, profileId: "" };
    }
  }

  async createIdealPayment(
    apiKey: string,
    input: {
      amountCents: number;
      description: string;
      redirectUrl: string;
      webhookUrl?: string;
      metadata: Record<string, string | undefined>;
      customer: { email: string; name?: string };
    }
  ) {
    const metadata = Object.fromEntries(
      Object.entries(input.metadata).filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    );
    const payment = await this.mollieRequest<MollieApiPayment>(apiKey, "/payments", {
      method: "POST",
      body: JSON.stringify({
        amount: { currency: "EUR", value: this.mollieAmountValue(input.amountCents) },
        description: input.description.slice(0, 255),
        redirectUrl: input.redirectUrl,
        ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
        method: "ideal" satisfies MolliePaymentMethod,
        metadata,
        billingAddress: {
          email: input.customer.email,
          givenName: input.customer.name || undefined
        }
      })
    });

    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl || !payment.id) {
      throw new MollieServiceError("Mollie gaf geen geldige checkout-url terug.", 502);
    }
    return { checkoutUrl, paymentId: payment.id };
  }

  async getPayment(apiKey: string, paymentId: string): Promise<MolliePaymentDetails> {
    const payment = await this.mollieRequest<MollieApiPayment>(apiKey, `/payments/${encodeURIComponent(paymentId)}`);
    return {
      paymentId: payment.id,
      status: this.normalizeStatus(payment.status),
      description: payment.description?.trim() || "",
      method: payment.method?.trim() || "",
      amount: payment.amount?.value
        ? { currency: payment.amount.currency?.trim() || "EUR", value: payment.amount.value }
        : null,
      metadata: this.readMetadata(payment.metadata)
    };
  }
}
