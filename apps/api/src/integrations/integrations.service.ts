import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  IntegrationTestMailInput,
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

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  private async getOrCreate() {
    const existing = await this.prisma.integrationSettings.findUnique({ where: { id: PRIMARY_ID } });
    if (existing) return existing;
    return this.prisma.integrationSettings.create({ data: { id: PRIMARY_ID } });
  }

  private normalizeGoogleAdsId(value: string) {
    const cleaned = cleanText(value, "", 40).toUpperCase().replace(/\s+/g, "");
    if (!cleaned) return DEFAULT_GOOGLE_ADS_ID;
    if (!/^AW-\d{6,20}$/.test(cleaned)) {
      throw new BadRequestException({ message: "Vul een geldig Google Ads conversie-ID in (bijv. AW-16851426878)." });
    }
    return cleaned;
  }

  async getSettings() {
    const row = await this.getOrCreate();
    return {
      mailRelay: {
        enabled: row.mailRelayEnabled,
        provider: (row.mailRelayProvider === "outlook" ? "outlook" : "smtp") as "smtp" | "outlook",
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
        envFallbackConfigured: this.mailService.isEnvConfigured()
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
    const provider = input.provider === "outlook" ? "outlook" : input.provider === "smtp" ? "smtp" : current.mailRelayProvider;
    const hostDefault = provider === "outlook" ? "smtp.office365.com" : current.mailRelayHost;

    const data = {
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

    await this.prisma.integrationSettings.update({
      where: { id: PRIMARY_ID },
      data
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

  async testMailRelay(input: IntegrationTestMailInput) {
    const to = cleanText(input?.to, "", 180).toLowerCase();
    if (!to || !to.includes("@")) {
      throw new BadRequestException({ message: "Vul een geldig e-mailadres in voor de testmail." });
    }

    const settings = await this.getOrCreate();
    const result = await this.mailService.sendTestEmail({
      to,
      fromName: settings.mailRelayFromName || "Tres Amigos",
      fromEmail: settings.mailRelayFromEmail || settings.mailRelayUsername
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
