import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  ClearGoogleOAuthSecretInput,
  IntegrationGoogleByCategory,
  IntegrationMailNotifications,
  IntegrationTestMailInput,
  MailNotifyCategory,
  MailRelayProvider,
  PublicIntegrationsSettings,
  UpdateIntegrationGoogleAdsInput,
  UpdateIntegrationMailRelayInput,
  UpdateIntegrationNewsletterInput
} from "@tresamigos/types";
import { cleanText } from "@tresamigos/utils";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.module";

const PRIMARY_ID = "primary";
const DEFAULT_GOOGLE_ADS_ID = "AW-16851426878";

const DEFAULT_NOTIFICATIONS: IntegrationMailNotifications = {
  applications: "work@tresamigos.nl",
  catering: "catering@tresamigos.nl",
  franchise: "Vilmon@tresamigos.nl",
  other: "no-reply@tresamigos.nl"
};

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  private async getOrCreate() {
    const existing = await this.prisma.integrationSettings.findUnique({ where: { id: PRIMARY_ID } });
    if (existing) return existing;
    return this.prisma.integrationSettings.create({
      data: {
        id: PRIMARY_ID,
        mailNotifyApplications: DEFAULT_NOTIFICATIONS.applications,
        mailNotifyCatering: DEFAULT_NOTIFICATIONS.catering,
        mailNotifyFranchise: DEFAULT_NOTIFICATIONS.franchise,
        mailNotifyOther: DEFAULT_NOTIFICATIONS.other
      }
    });
  }

  private normalizeGoogleAdsId(value: string) {
    const cleaned = cleanText(value, "", 40).toUpperCase().replace(/\s+/g, "");
    if (!cleaned) return DEFAULT_GOOGLE_ADS_ID;
    if (!/^AW-\d{6,20}$/.test(cleaned)) {
      throw new BadRequestException({ message: "Vul een geldig Google Ads conversie-ID in (bijv. AW-16851426878)." });
    }
    return cleaned;
  }

  private normalizeEmail(value: unknown, fallback: string) {
    const email = cleanText(value, fallback, 180);
    return email.includes("@") ? email : fallback;
  }

  private notificationsFromRow(row: {
    mailNotifyApplications: string;
    mailNotifyCatering: string;
    mailNotifyFranchise: string;
    mailNotifyOther: string;
  }): IntegrationMailNotifications {
    return {
      applications: this.normalizeEmail(row.mailNotifyApplications, DEFAULT_NOTIFICATIONS.applications),
      catering: this.normalizeEmail(row.mailNotifyCatering, DEFAULT_NOTIFICATIONS.catering),
      franchise: this.normalizeEmail(row.mailNotifyFranchise, DEFAULT_NOTIFICATIONS.franchise),
      other: this.normalizeEmail(row.mailNotifyOther, DEFAULT_NOTIFICATIONS.other)
    };
  }

  private normalizeProvider(value: string | undefined): MailRelayProvider {
    if (value === "outlook" || value === "google" || value === "smtp") return value;
    return "smtp";
  }

  private maskSecret(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.length <= 8) return "••••••••";
    return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
  }

  async getSettings() {
    const row = await this.getOrCreate();
    const oauth = await this.mailService.resolveGoogleOAuthCreds();
    const dbSecret = String(row.mailRelayGoogleClientSecret || "").trim();
    const dbClientId = String(row.mailRelayGoogleClientId || "").trim();
    return {
      mailRelay: {
        enabled: row.mailRelayEnabled,
        provider: this.normalizeProvider(row.mailRelayProvider),
        host: row.mailRelayHost,
        port: row.mailRelayPort,
        secure: row.mailRelaySecure,
        username: row.mailRelayUsername,
        passwordSet: Boolean(row.mailRelayPassword),
        fromEmail: row.mailRelayFromEmail,
        fromName: row.mailRelayFromName,
        lastTestAt: row.mailRelayLastTestAt?.toISOString() ?? null,
        lastStatus: row.mailRelayLastStatus,
        lastMessage: row.mailRelayLastMessage,
        envFallbackConfigured: this.mailService.isEnvConfigured(),
        googleConnected: Boolean(row.mailRelayGoogleRefreshToken && row.mailRelayGoogleEmail),
        googleEmail: row.mailRelayGoogleEmail,
        googleOAuthConfigured: Boolean(oauth.clientId && oauth.clientSecret),
        googleOAuthSource: oauth.source,
        googleClientId: dbClientId || (oauth.source === "env" ? oauth.clientId : ""),
        googleClientSecretSet: Boolean(dbSecret) || oauth.source === "env",
        googleClientSecretMasked: dbSecret
          ? this.maskSecret(dbSecret)
          : oauth.source === "env"
            ? "•••••••• (env)"
            : "",
        googleRedirectUri: this.mailService.googleRedirectUri(),
        googleByCategory: this.mailService.publicGoogleByCategory(row.mailRelayGoogleByCategory) as IntegrationGoogleByCategory,
        notifications: this.notificationsFromRow(row)
      },
      googleAds: {
        enabled: row.googleAdsEnabled,
        conversionId: row.googleAdsConversionId || DEFAULT_GOOGLE_ADS_ID
      },
      newsletter: {
        enabled: row.newsletterEnabled,
        showFooter: row.newsletterShowFooter,
        showHome: row.newsletterShowHome,
        showPages: row.newsletterShowPages
      }
    };
  }

  async getPublicSettings(): Promise<PublicIntegrationsSettings> {
    const settings = await this.getSettings();
    return {
      googleAds: settings.googleAds,
      newsletter: settings.newsletter
    };
  }

  async updateMailRelay(input: UpdateIntegrationMailRelayInput) {
    const current = await this.getOrCreate();
    const provider = input.provider
      ? this.normalizeProvider(input.provider)
      : this.normalizeProvider(current.mailRelayProvider);
    const hostDefault = provider === "outlook" ? "smtp.office365.com" : provider === "google" ? "smtp.gmail.com" : current.mailRelayHost;

    if (input.disconnectGoogle) {
      await this.mailService.disconnectGoogle();
      return this.getSettings();
    }

    if (input.disconnectGoogleCategory) {
      await this.mailService.disconnectGoogleCategory(input.disconnectGoogleCategory);
      return this.getSettings();
    }

    const data: Record<string, unknown> = {
      mailRelayEnabled: input.enabled ?? current.mailRelayEnabled,
      mailRelayProvider: provider,
      mailRelayHost: input.host !== undefined ? cleanText(input.host, "", 200) : hostDefault,
      mailRelayPort:
        input.port !== undefined
          ? Math.min(65535, Math.max(1, Number(input.port) || 587))
          : current.mailRelayPort,
      mailRelaySecure: input.secure ?? current.mailRelaySecure,
      mailRelayUsername:
        input.username !== undefined ? cleanText(input.username, "", 200) : current.mailRelayUsername,
      mailRelayFromEmail:
        input.fromEmail !== undefined ? cleanText(input.fromEmail, "", 200) : current.mailRelayFromEmail,
      mailRelayFromName:
        input.fromName !== undefined ? cleanText(input.fromName, "", 120) || "Tres Amigos" : current.mailRelayFromName,
      mailRelayPassword: current.mailRelayPassword
    };

    if (input.clearPassword) {
      data.mailRelayPassword = "";
    } else if (input.password !== undefined && input.password.trim()) {
      data.mailRelayPassword = input.password.trim();
    }

    if (provider === "outlook" && !data.mailRelayHost) {
      data.mailRelayHost = "smtp.office365.com";
    }
    if (provider === "google") {
      data.mailRelayHost = "smtp.gmail.com";
      data.mailRelayPort = 465;
      data.mailRelaySecure = true;
    }

    if (input.notifications) {
      data.mailNotifyApplications = this.normalizeEmail(
        input.notifications.applications,
        current.mailNotifyApplications || DEFAULT_NOTIFICATIONS.applications
      );
      data.mailNotifyCatering = this.normalizeEmail(
        input.notifications.catering,
        current.mailNotifyCatering || DEFAULT_NOTIFICATIONS.catering
      );
      data.mailNotifyFranchise = this.normalizeEmail(
        input.notifications.franchise,
        current.mailNotifyFranchise || DEFAULT_NOTIFICATIONS.franchise
      );
      data.mailNotifyOther = this.normalizeEmail(
        input.notifications.other,
        current.mailNotifyOther || DEFAULT_NOTIFICATIONS.other
      );
    }

    if (input.googleClientId !== undefined) {
      data.mailRelayGoogleClientId = cleanText(input.googleClientId, "", 300);
    }

    // Secret mag hier ALLEEN gezet/overschreven worden met een niet-lege waarde.
    // Leeg laten of clearen via PUT wordt bewust genegeerd — alleen clearGoogleOAuthSecret.
    if (input.googleClientSecret !== undefined) {
      const secret = String(input.googleClientSecret || "").trim();
      if (secret) {
        data.mailRelayGoogleClientSecret = secret;
      }
    }

    await this.prisma.integrationSettings.update({
      where: { id: PRIMARY_ID },
      data
    });

    this.mailService.invalidateCache();
    return this.getSettings();
  }

  async clearGoogleOAuthSecret(input: ClearGoogleOAuthSecretInput) {
    const confirmation = String(input?.confirmation || "").trim();
    if (confirmation !== "bevestig") {
      throw new BadRequestException({
        message: 'Secret wissen geweigerd. Typ exact "bevestig" — andere tekst wordt niet geaccepteerd.'
      });
    }

    await this.prisma.integrationSettings.update({
      where: { id: PRIMARY_ID },
      data: { mailRelayGoogleClientSecret: "" }
    });
    this.mailService.invalidateCache();
    return this.getSettings();
  }

  async updateGoogleAds(input: UpdateIntegrationGoogleAdsInput) {
    const current = await this.getOrCreate();
    const conversionId =
      input.conversionId !== undefined
        ? this.normalizeGoogleAdsId(input.conversionId)
        : current.googleAdsConversionId || DEFAULT_GOOGLE_ADS_ID;

    await this.prisma.integrationSettings.update({
      where: { id: PRIMARY_ID },
      data: {
        googleAdsEnabled: input.enabled ?? current.googleAdsEnabled,
        googleAdsConversionId: conversionId
      }
    });

    return this.getSettings();
  }

  async updateNewsletter(input: UpdateIntegrationNewsletterInput) {
    const current = await this.getOrCreate();

    await this.prisma.integrationSettings.update({
      where: { id: PRIMARY_ID },
      data: {
        newsletterEnabled: input.enabled ?? current.newsletterEnabled,
        newsletterShowFooter: input.showFooter ?? current.newsletterShowFooter,
        newsletterShowHome: input.showHome ?? current.newsletterShowHome,
        newsletterShowPages: input.showPages ?? current.newsletterShowPages
      }
    });

    return this.getSettings();
  }

  async startGoogleOAuth(
    requestOrigin?: string,
    options?: { category?: MailNotifyCategory }
  ) {
    try {
      const url = await this.mailService.createGoogleOAuthUrl(requestOrigin, options);
      return { url };
    } catch (error) {
      throw new BadRequestException({
        message: error instanceof Error ? error.message : "Google login starten mislukt."
      });
    }
  }

  async handleGoogleOAuthCallback(code: string, state: string, requestOrigin?: string) {
    const result = await this.mailService.completeGoogleOAuth(code, state, requestOrigin);
    const adminBase = this.mailService.adminRedirectBase();
    const path = adminBase.includes("/admin") ? "" : "/admin/";
    const category = result.category ? `&category=${encodeURIComponent(result.category)}` : "";
    return `${adminBase}${path}?tab=siteSettings&view=integrations&sub=mail&googleMail=connected&email=${encodeURIComponent(result.email)}${category}`;
  }

  async testMailRelay(input: IntegrationTestMailInput) {
    const to = cleanText(input?.to, "", 180).toLowerCase();
    if (!to || !to.includes("@")) {
      throw new BadRequestException({ message: "Vul een geldig e-mailadres in voor de testmail." });
    }

    const settings = await this.getOrCreate();
    const result = await this.mailService.sendTestEmail({
      to,
      fromName: settings.mailRelayFromName || "Tres Amigos",
      fromEmail: settings.mailRelayFromEmail || settings.mailRelayGoogleEmail || settings.mailRelayUsername
    });

    await this.prisma.integrationSettings.update({
      where: { id: PRIMARY_ID },
      data: {
        mailRelayLastTestAt: new Date(),
        mailRelayLastStatus: result.ok ? "success" : "error",
        mailRelayLastMessage: result.message
      }
    });

    if (!result.ok) {
      throw new BadRequestException({ message: result.message });
    }

    return {
      message: result.message,
      integrations: await this.getSettings()
    };
  }
}
