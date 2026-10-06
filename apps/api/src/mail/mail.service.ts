import { Injectable, Logger } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { MailNotifyCategory } from "@tresamigos/types";
import { PrismaService } from "../prisma/prisma.module";
import { RedisService } from "../redis/redis.module";

interface PromoMailInput {
  to: string;
  firstName: string;
  lastName: string;
  discountCode: string;
  fromName: string;
  replyTo: string;
  subject: string;
  bodyTemplate: string;
}

interface SmtpConfig {
  kind: "smtp";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  source: "db" | "env";
}

interface GoogleConfig {
  kind: "google";
  email: string;
  accessToken: string;
  refreshToken: string;
  fromEmail: string;
  fromName: string;
  source: "db";
}

type MailConfig = SmtpConfig | GoogleConfig;

type StoredGoogleAccount = {
  email: string;
  refreshToken: string;
  accessToken: string;
  expiry: string | null;
};

type GoogleByCategoryStore = Partial<Record<MailNotifyCategory, StoredGoogleAccount>>;

type OAuthStatePayload = {
  category?: MailNotifyCategory;
  redirectUri?: string;
};

const DEFAULT_NOTIFY: Record<MailNotifyCategory, string> = {
  applications: "work@tresamigos.nl",
  catering: "catering@tresamigos.nl",
  franchise: "Vilmon@tresamigos.nl",
  other: "no-reply@tresamigos.nl"
};

const MAIL_NOTIFY_CATEGORIES: MailNotifyCategory[] = ["applications", "catering", "franchise", "other"];

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const USERINFO_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const PRODUCTION_GOOGLE_REDIRECT_URI = "https://tresamigos.nl/api/integrations/mailrelay/google/callback";

function canonicalizeGoogleRedirectUri(raw: string): string {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "tresamigos.nl") {
      return PRODUCTION_GOOGLE_REDIRECT_URI;
    }
    url.hash = "";
    url.search = "";
    url.pathname = "/api/integrations/mailrelay/google/callback";
    return url.toString().replace(/\/$/, "");
  } catch {
    return PRODUCTION_GOOGLE_REDIRECT_URI;
  }
}

function isMailNotifyCategory(value: unknown): value is MailNotifyCategory {
  return typeof value === "string" && MAIL_NOTIFY_CATEGORIES.includes(value as MailNotifyCategory);
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private cachedConfig: MailConfig | null | undefined;
  private cacheAt = 0;
  private cachedOAuthCreds: { clientId: string; clientSecret: string; source: "db" | "env" | "none" } | null = null;
  private oauthCredsAt = 0;
  private readonly oauthStateMemory = new Map<string, number>();
  private readonly oauthPayloadMemory = new Map<string, OAuthStatePayload>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  invalidateCache() {
    this.cachedConfig = undefined;
    this.cacheAt = 0;
    this.cachedOAuthCreds = null;
    this.oauthCredsAt = 0;
  }

  isEnvConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  private envGoogleClientId() {
    return process.env.GOOGLE_MAIL_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "";
  }

  private envGoogleClientSecret() {
    return process.env.GOOGLE_MAIL_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
  }

  async resolveGoogleOAuthCreds() {
    const now = Date.now();
    if (this.cachedOAuthCreds && now - this.oauthCredsAt < 15_000) {
      return this.cachedOAuthCreds;
    }
    try {
      const row = await this.prisma.integrationSettings.findUnique({ where: { id: "primary" } });
      const dbId = String(row?.mailRelayGoogleClientId || "").trim();
      const dbSecret = String(row?.mailRelayGoogleClientSecret || "").trim();
      if (dbId && dbSecret) {
        this.cachedOAuthCreds = { clientId: dbId, clientSecret: dbSecret, source: "db" };
        this.oauthCredsAt = now;
        return this.cachedOAuthCreds;
      }
    } catch {
      /* fall through to env */
    }
    const envId = this.envGoogleClientId();
    const envSecret = this.envGoogleClientSecret();
    this.cachedOAuthCreds =
      envId && envSecret
        ? { clientId: envId, clientSecret: envSecret, source: "env" }
        : { clientId: envId || "", clientSecret: envSecret || "", source: "none" };
    this.oauthCredsAt = now;
    return this.cachedOAuthCreds;
  }

  async isGoogleOAuthConfigured() {
    const creds = await this.resolveGoogleOAuthCreds();
    return Boolean(creds.clientId && creds.clientSecret);
  }

  googleRedirectUri(requestOrigin?: string) {
    const configured = String(process.env.GOOGLE_MAIL_REDIRECT_URI || "").trim();
    if (configured) return canonicalizeGoogleRedirectUri(configured);
    const base = String(process.env.API_PUBLIC_URL || process.env.PUBLIC_API_URL || "").trim();
    if (base) return canonicalizeGoogleRedirectUri(`${base.replace(/\/$/, "")}/api/integrations/mailrelay/google/callback`);
    if (requestOrigin) {
      return canonicalizeGoogleRedirectUri(`${requestOrigin.replace(/\/$/, "")}/api/integrations/mailrelay/google/callback`);
    }
    return PRODUCTION_GOOGLE_REDIRECT_URI;
  }

  adminRedirectBase() {
    return (process.env.ADMIN_PUBLIC_URL || process.env.CORS_ORIGINS?.split(",")[0] || "http://localhost:5181").replace(
      /\/$/,
      ""
    );
  }

  /** Sync hint: env is available. Prefer `isReady()` when DB mailrelay matters. */
  isConfigured() {
    return this.isEnvConfigured();
  }

  async isReady() {
    return Boolean(await this.resolveConfig());
  }

  async getNotifyEmail(category: MailNotifyCategory): Promise<string> {
    try {
      const row = await this.prisma.integrationSettings.findUnique({ where: { id: "primary" } });
      const map: Record<MailNotifyCategory, string | undefined> = {
        applications: row?.mailNotifyApplications,
        catering: row?.mailNotifyCatering,
        franchise: row?.mailNotifyFranchise,
        other: row?.mailNotifyOther
      };
      const value = String(map[category] || "").trim();
      if (value.includes("@")) return value;
    } catch (error) {
      this.logger.warn(`Notify-email laden mislukt: ${error instanceof Error ? error.message : "onbekend"}`);
    }
    return DEFAULT_NOTIFY[category];
  }

  parseGoogleByCategory(raw: unknown): GoogleByCategoryStore {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const result: GoogleByCategoryStore = {};
    for (const category of MAIL_NOTIFY_CATEGORIES) {
      const entry = (raw as Record<string, unknown>)[category];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const record = entry as Record<string, unknown>;
      const email = String(record.email || "").trim().toLowerCase();
      const refreshToken = String(record.refreshToken || "").trim();
      if (!email || !refreshToken) continue;
      result[category] = {
        email,
        refreshToken,
        accessToken: String(record.accessToken || "").trim(),
        expiry: record.expiry ? String(record.expiry) : null
      };
    }
    return result;
  }

  publicGoogleByCategory(raw: unknown): Record<MailNotifyCategory, { connected: boolean; email: string }> {
    const store = this.parseGoogleByCategory(raw);
    return {
      applications: {
        connected: Boolean(store.applications?.refreshToken),
        email: store.applications?.email || ""
      },
      catering: {
        connected: Boolean(store.catering?.refreshToken),
        email: store.catering?.email || ""
      },
      franchise: {
        connected: Boolean(store.franchise?.refreshToken),
        email: store.franchise?.email || ""
      },
      other: {
        connected: Boolean(store.other?.refreshToken),
        email: store.other?.email || ""
      }
    };
  }

  private envConfig(): SmtpConfig | null {
    if (!this.isEnvConfigured()) return null;
    const port = Number(process.env.SMTP_PORT || 587);
    return {
      kind: "smtp",
      host: process.env.SMTP_HOST || "",
      port,
      secure: port === 465 || process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER || "",
      fromName: "Tres Amigos",
      source: "env"
    };
  }

  private async resolveConfig(category?: MailNotifyCategory): Promise<MailConfig | null> {
    const now = Date.now();
    if (!category && this.cachedConfig !== undefined && now - this.cacheAt < 15_000) {
      return this.cachedConfig;
    }

    try {
      const row = await this.prisma.integrationSettings.findUnique({ where: { id: "primary" } });
      if (row?.mailRelayEnabled && category) {
        const byCategory = this.parseGoogleByCategory(row.mailRelayGoogleByCategory);
        const account = byCategory[category];
        if (account?.refreshToken) {
          const accessToken = await this.ensureStoredGoogleAccessToken(category, account, byCategory, row.mailRelayFromName);
          return {
            kind: "google",
            email: account.email,
            accessToken,
            refreshToken: account.refreshToken,
            fromEmail: account.email,
            fromName: row.mailRelayFromName || "Tres Amigos",
            source: "db"
          };
        }
      }

      if (row?.mailRelayEnabled && row.mailRelayProvider === "google" && row.mailRelayGoogleRefreshToken) {
        const accessToken = await this.ensureGoogleAccessToken(row);
        this.cachedConfig = {
          kind: "google",
          email: row.mailRelayGoogleEmail || row.mailRelayFromEmail || row.mailRelayUsername,
          accessToken,
          refreshToken: row.mailRelayGoogleRefreshToken,
          fromEmail: row.mailRelayFromEmail || row.mailRelayGoogleEmail || row.mailRelayUsername,
          fromName: row.mailRelayFromName || "Tres Amigos",
          source: "db"
        };
        this.cacheAt = now;
        return this.cachedConfig;
      }

      if (row?.mailRelayEnabled && row.mailRelayHost && row.mailRelayUsername && row.mailRelayPassword) {
        this.cachedConfig = {
          kind: "smtp",
          host: row.mailRelayHost,
          port: row.mailRelayPort || 587,
          secure: row.mailRelaySecure || row.mailRelayPort === 465,
          user: row.mailRelayUsername,
          pass: row.mailRelayPassword,
          fromEmail: row.mailRelayFromEmail || row.mailRelayUsername,
          fromName: row.mailRelayFromName || "Tres Amigos",
          source: "db"
        };
        this.cacheAt = now;
        return this.cachedConfig;
      }
    } catch (error) {
      this.logger.warn(`Integratie-SMTP laden mislukt: ${error instanceof Error ? error.message : "onbekend"}`);
    }

    if (!category) {
      this.cachedConfig = this.envConfig();
      this.cacheAt = now;
      return this.cachedConfig;
    }
    return this.resolveConfig();
  }

  private async ensureStoredGoogleAccessToken(
    category: MailNotifyCategory,
    account: StoredGoogleAccount,
    store: GoogleByCategoryStore,
    fromName: string
  ) {
    const expiry = account.expiry ? new Date(account.expiry).getTime() : 0;
    if (account.accessToken && expiry > Date.now() + 60_000) {
      return account.accessToken;
    }

    const refreshed = await this.refreshGoogleToken(account.refreshToken);
    const next: StoredGoogleAccount = {
      ...account,
      accessToken: refreshed.accessToken,
      expiry: refreshed.expiry.toISOString()
    };
    store[category] = next;
    await this.prisma.integrationSettings.update({
      where: { id: "primary" },
      data: {
        mailRelayGoogleByCategory: store,
        mailRelayFromName: fromName || "Tres Amigos"
      }
    });
    this.invalidateCache();
    return refreshed.accessToken;
  }

  private async ensureGoogleAccessToken(row: {
    mailRelayGoogleAccessToken: string;
    mailRelayGoogleRefreshToken: string;
    mailRelayGoogleTokenExpiry: Date | null;
  }) {
    const expiry = row.mailRelayGoogleTokenExpiry?.getTime() || 0;
    if (row.mailRelayGoogleAccessToken && expiry > Date.now() + 60_000) {
      return row.mailRelayGoogleAccessToken;
    }

    const refreshed = await this.refreshGoogleToken(row.mailRelayGoogleRefreshToken);
    await this.prisma.integrationSettings.update({
      where: { id: "primary" },
      data: {
        mailRelayGoogleAccessToken: refreshed.accessToken,
        mailRelayGoogleTokenExpiry: refreshed.expiry
      }
    });
    this.invalidateCache();
    return refreshed.accessToken;
  }

  private async refreshGoogleToken(refreshToken: string) {
    const creds = await this.resolveGoogleOAuthCreds();
    const body = new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    });
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || "Google token vernieuwen mislukt.");
    }
    return {
      accessToken: data.access_token,
      expiry: new Date(Date.now() + (data.expires_in || 3600) * 1000)
    };
  }

  private createSmtpTransport(config: SmtpConfig) {
    const options: SMTPTransport.Options = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    };
    return nodemailer.createTransport(options);
  }

  private async createGoogleTransport(config: GoogleConfig) {
    const creds = await this.resolveGoogleOAuthCreds();
    const options: SMTPTransport.Options = {
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.email,
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        refreshToken: config.refreshToken,
        accessToken: config.accessToken
      }
    };
    return nodemailer.createTransport(options);
  }

  private async withTransport<T>(
    fn: (transport: nodemailer.Transporter, config: MailConfig) => Promise<T>,
    category?: MailNotifyCategory
  ) {
    const config = await this.resolveConfig(category);
    if (!config) {
      this.logger.warn("SMTP/Gmail niet geconfigureerd — mail niet verstuurd.");
      return null;
    }
    const transport =
      config.kind === "google" ? await this.createGoogleTransport(config) : this.createSmtpTransport(config);
    return fn(transport, config);
  }

  private async sendRaw(input: {
    to: string;
    fromName: string;
    fromEmail?: string;
    replyTo?: string;
    subject: string;
    text: string;
    category?: MailNotifyCategory;
  }) {
    return this.withTransport(async (transport, config) => {
      const fromAddress = input.fromEmail || config.fromEmail;
      await transport.sendMail({
        from: `"${input.fromName || config.fromName}" <${fromAddress}>`,
        to: input.to,
        replyTo: input.replyTo || fromAddress,
        subject: input.subject,
        text: input.text
      });
      return true;
    }, input.category);
  }

  async sendPromoEmail(input: PromoMailInput) {
    const body = input.bodyTemplate
      .replace(/\{\{firstName\}\}/g, input.firstName)
      .replace(/\{\{lastName\}\}/g, input.lastName)
      .replace(/\{\{discountCode\}\}/g, input.discountCode);

    return Boolean(
      await this.sendRaw({
        to: input.to,
        fromName: input.fromName,
        replyTo: input.replyTo,
        subject: input.subject,
        text: body
      })
    );
  }

  async sendContactEmail(input: {
    to: string;
    fromName: string;
    replyTo: string;
    subject: string;
    name: string;
    email: string;
    topic: string;
    message: string;
  }) {
    const body = [
      "Nieuw contactbericht via tresamigos.nl",
      "",
      `Naam: ${input.name}`,
      `E-mail: ${input.email}`,
      `Onderwerp: ${input.topic}`,
      "",
      input.message
    ].join("\n");

    return Boolean(
      await this.sendRaw({
        to: input.to,
        fromName: input.fromName,
        replyTo: input.email || input.replyTo,
        subject: input.subject,
        text: body,
        category: "other"
      })
    );
  }

  async sendNotificationEmail(input: {
    to: string;
    fromName?: string;
    replyTo?: string;
    subject: string;
    body: string;
    category?: MailNotifyCategory;
  }) {
    return Boolean(
      await this.sendRaw({
        to: input.to,
        fromName: input.fromName || "Tres Amigos",
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.body,
        category: input.category
      })
    );
  }

  async sendCateringNotificationEmail(input: {
    to: string;
    fromName: string;
    replyTo: string;
    subject: string;
    body: string;
  }) {
    return this.sendNotificationEmail({ ...input, category: "catering" });
  }

  async sendTestEmail(input: { to: string; fromName: string; fromEmail?: string }) {
    try {
      const config = await this.resolveConfig();
      if (!config) {
        return {
          ok: false,
          message:
            "Mail is niet geconfigureerd. Kies Google (inloggen) of vul SMTP in, of zet SMTP_* in .env."
        };
      }

      const detail =
        config.kind === "google"
          ? `Bron: Google Gmail (${config.email})`
          : `Bron: ${config.source === "db" ? "Integraties (mailrelay)" : "Omgevingsvariabelen (.env)"}\nHost: ${config.host}:${config.port}`;

      await this.sendRaw({
        to: input.to,
        fromName: input.fromName || config.fromName,
        fromEmail: input.fromEmail || config.fromEmail,
        subject: "Tres Amigos — testmail",
        text: ["Dit is een testmail van Tres Amigos admin.", "", detail, `Verstuurd om: ${new Date().toLocaleString("nl-NL")}`].join(
          "\n"
        )
      });

      return { ok: true, message: `Testmail verstuurd naar ${input.to}.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Testmail mislukt.";
      this.logger.error(`Testmail mislukt: ${message}`);
      return { ok: false, message };
    }
  }

  private oauthStateKey(state: string) {
    return `google-mail-oauth:${state}`;
  }

  async createGoogleOAuthUrl(
    requestOrigin?: string,
    options?: { category?: MailNotifyCategory }
  ) {
    if (!(await this.isGoogleOAuthConfigured())) {
      throw new Error(
        "Google OAuth ontbreekt. Vul Client ID en Secret in bij Koppelingen → E-mail, of zet GOOGLE_MAIL_CLIENT_ID/SECRET in .env."
      );
    }
    const creds = await this.resolveGoogleOAuthCreds();
    const state = createHash("sha256").update(randomBytes(32)).digest("hex");
    const key = this.oauthStateKey(state);
    const redirectUri = this.googleRedirectUri(requestOrigin);
    const payload: OAuthStatePayload = {
      category: options?.category && isMailNotifyCategory(options.category) ? options.category : undefined,
      redirectUri
    };
    const payloadJson = JSON.stringify(payload);
    try {
      await this.redis.client.set(key, payloadJson, "EX", 600);
    } catch {
      this.oauthStateMemory.set(state, Date.now() + 600_000);
      this.oauthPayloadMemory.set(state, payload);
    }

    // select_account: altijd account kiezen op Google's pagina (geen vooraf geforceerd adres).
    const params = new URLSearchParams({
      client_id: creds.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: `${GMAIL_SEND_SCOPE} ${USERINFO_SCOPE}`,
      access_type: "offline",
      prompt: "select_account consent",
      include_granted_scopes: "true",
      state
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  private async consumeOAuthState(state: string): Promise<OAuthStatePayload | null> {
    if (!state) return null;
    const key = this.oauthStateKey(state);
    try {
      const value = await this.redis.client.get(key);
      if (value) {
        await this.redis.client.del(key);
        try {
          const parsed = JSON.parse(value) as OAuthStatePayload;
          return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
          return {};
        }
      }
    } catch {
      /* memory fallback */
    }
    const expires = this.oauthStateMemory.get(state);
    if (!expires || expires <= Date.now()) {
      this.oauthStateMemory.delete(state);
      this.oauthPayloadMemory.delete(state);
      return null;
    }
    this.oauthStateMemory.delete(state);
    const payload = this.oauthPayloadMemory.get(state) || {};
    this.oauthPayloadMemory.delete(state);
    return payload;
  }

  async completeGoogleOAuth(code: string, state: string, requestOrigin?: string) {
    const statePayload = await this.consumeOAuthState(state);
    if (!statePayload) {
      throw new Error("Ongeldige of verlopen Google-login. Probeer opnieuw.");
    }
    if (!code) throw new Error("Google gaf geen autorisatiecode.");

    const creds = await this.resolveGoogleOAuthCreds();
    const redirectUri = statePayload.redirectUri || this.googleRedirectUri(requestOrigin);
    const tokenBody = new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    });
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody
    });
    const tokens = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (!tokenResponse.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || tokens.error || "Google tokens ophalen mislukt.");
    }

    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = (await profileResponse.json()) as { email?: string };
    const email = String(profile.email || "").trim().toLowerCase();
    if (!email) throw new Error("Kon Google e-mailadres niet ophalen.");

    const existing = await this.prisma.integrationSettings.findUnique({ where: { id: "primary" } });
    const category = statePayload.category;
    const byCategory = this.parseGoogleByCategory(existing?.mailRelayGoogleByCategory);
    const existingCategoryRefresh = category ? byCategory[category]?.refreshToken || "" : "";
    const refreshToken =
      tokens.refresh_token ||
      existingCategoryRefresh ||
      existing?.mailRelayGoogleRefreshToken ||
      "";
    if (!refreshToken) {
      throw new Error(
        "Geen refresh token ontvangen. Disconnect de app in Google Account → Beveiliging → Apps en probeer opnieuw."
      );
    }

    const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
    const notifyPatch: Record<string, string> = {};
    if (category) {
      byCategory[category] = {
        email,
        refreshToken,
        accessToken: tokens.access_token,
        expiry: expiry.toISOString()
      };
      const notifyField =
        category === "applications"
          ? "mailNotifyApplications"
          : category === "catering"
            ? "mailNotifyCatering"
            : category === "franchise"
              ? "mailNotifyFranchise"
              : "mailNotifyOther";
      notifyPatch[notifyField] = email;
    }

    await this.prisma.integrationSettings.upsert({
      where: { id: "primary" },
      create: {
        id: "primary",
        mailRelayEnabled: true,
        mailRelayProvider: "google",
        mailRelayGoogleEmail: email,
        mailRelayGoogleAccessToken: tokens.access_token,
        mailRelayGoogleRefreshToken: refreshToken,
        mailRelayGoogleTokenExpiry: expiry,
        mailRelayGoogleByCategory: byCategory,
        mailRelayFromEmail: email,
        mailRelayFromName: "Tres Amigos",
        mailRelayLastStatus: "success",
        mailRelayLastMessage: category
          ? `Google gekoppeld voor ${category}: ${email}`
          : `Google gekoppeld: ${email}`,
        mailRelayLastTestAt: new Date(),
        mailNotifyApplications: notifyPatch.mailNotifyApplications || DEFAULT_NOTIFY.applications,
        mailNotifyCatering: notifyPatch.mailNotifyCatering || DEFAULT_NOTIFY.catering,
        mailNotifyFranchise: notifyPatch.mailNotifyFranchise || DEFAULT_NOTIFY.franchise,
        mailNotifyOther: notifyPatch.mailNotifyOther || DEFAULT_NOTIFY.other
      },
      update: {
        mailRelayEnabled: true,
        mailRelayProvider: "google",
        mailRelayGoogleEmail: email,
        mailRelayGoogleAccessToken: tokens.access_token,
        mailRelayGoogleRefreshToken: refreshToken,
        mailRelayGoogleTokenExpiry: expiry,
        mailRelayGoogleByCategory: byCategory,
        mailRelayFromEmail: email,
        mailRelayLastStatus: "success",
        mailRelayLastMessage: category
          ? `Google gekoppeld voor ${category}: ${email}`
          : `Google gekoppeld: ${email}`,
        mailRelayLastTestAt: new Date(),
        ...notifyPatch
      }
    });

    this.invalidateCache();
    return { email, category };
  }

  async disconnectGoogle() {
    await this.prisma.integrationSettings.update({
      where: { id: "primary" },
      data: {
        mailRelayGoogleRefreshToken: "",
        mailRelayGoogleAccessToken: "",
        mailRelayGoogleTokenExpiry: null,
        mailRelayGoogleEmail: "",
        mailRelayGoogleByCategory: {},
        mailRelayProvider: "smtp",
        mailRelayLastStatus: "",
        mailRelayLastMessage: "Google ontkoppeld."
      }
    });
    this.invalidateCache();
  }

  async disconnectGoogleCategory(category: MailNotifyCategory) {
    const existing = await this.prisma.integrationSettings.findUnique({ where: { id: "primary" } });
    if (!existing) return;
    const byCategory = this.parseGoogleByCategory(existing.mailRelayGoogleByCategory);
    delete byCategory[category];
    await this.prisma.integrationSettings.update({
      where: { id: "primary" },
      data: {
        mailRelayGoogleByCategory: byCategory,
        mailRelayLastMessage: `Google ontkoppeld voor ${category}.`
      }
    });
    this.invalidateCache();
  }
}
