import { Injectable, Logger } from "@nestjs/common";
import type { MollieMode } from "@tresamigos/types";
import { PrismaService } from "../prisma/prisma.module";

const PRIMARY_ID = "primary";
const MOLLIE_API = "https://api.mollie.com/v2";

export type MollieKeyKind = "test" | "live";

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

  private publicBase() {
    return String(process.env.API_PUBLIC_URL || process.env.PUBLIC_API_URL || "https://tresamigos.nl")
      .trim()
      .replace(/\/$/, "");
  }

  endpointUrls() {
    const base = this.publicBase();
    return {
      webhookUrl: `${base}/api/payments/mollie/webhook`,
      createPaymentUrl: `${base}/api/payments/mollie/create`,
      statusUrl: `${base}/api/payments/mollie/status`
    };
  }

  async getRow() {
    return this.prisma.integrationSettings.findUnique({ where: { id: PRIMARY_ID } });
  }

  async resolveActiveApiKey(): Promise<{ key: string; mode: MollieMode } | null> {
    const row = await this.getRow();
    if (!row?.mollieEnabled) return null;
    const mode = this.normalizeMode(row.mollieMode);
    const key = mode === "live" ? row.mollieLiveApiKey : row.mollieTestApiKey;
    if (!key?.trim()) return null;
    return { key: key.trim(), mode };
  }

  async ping(apiKey: string) {
    const response = await fetch(`${MOLLIE_API}/organizations/me`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      }
    });
    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      name?: string;
      email?: string;
      detail?: string;
      title?: string;
      status?: number;
    };
    if (!response.ok) {
      const message = data.detail || data.title || `Mollie gaf status ${response.status}.`;
      this.logger.warn(`Mollie ping mislukt: ${message}`);
      return { ok: false as const, message, profileId: "" };
    }
    return {
      ok: true as const,
      message: `Verbonden met Mollie${data.name ? ` (${data.name})` : ""}${data.email ? ` · ${data.email}` : ""}.`,
      profileId: String(data.id || "").trim()
    };
  }
}
