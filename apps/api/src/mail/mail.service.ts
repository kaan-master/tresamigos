import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { PrismaService } from "../prisma/prisma.module";

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
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  source: "db" | "env";
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private cachedConfig: SmtpConfig | null | undefined;
  private cacheAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  invalidateCache() {
    this.cachedConfig = undefined;
    this.cacheAt = 0;
  }

  isEnvConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /** Sync hint: env is available. Prefer `isReady()` when DB mailrelay matters. */
  isConfigured() {
    return this.isEnvConfigured();
  }

  async isReady() {
    return Boolean(await this.resolveConfig());
  }

  private envConfig(): SmtpConfig | null {
    if (!this.isEnvConfigured()) return null;
    const port = Number(process.env.SMTP_PORT || 587);
    return {
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

  private async resolveConfig(): Promise<SmtpConfig | null> {
    const now = Date.now();
    if (this.cachedConfig !== undefined && now - this.cacheAt < 15_000) {
      return this.cachedConfig;
    }

    try {
      const row = await this.prisma.integrationSettings.findUnique({ where: { id: "primary" } });
      if (row?.mailRelayEnabled && row.mailRelayHost && row.mailRelayUsername && row.mailRelayPassword) {
        this.cachedConfig = {
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

    this.cachedConfig = this.envConfig();
    this.cacheAt = now;
    return this.cachedConfig;
  }

  private createTransport(config: SmtpConfig) {
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

  private async withTransport<T>(fn: (transport: nodemailer.Transporter, config: SmtpConfig) => Promise<T>) {
    const config = await this.resolveConfig();
    if (!config) {
      this.logger.warn("SMTP niet geconfigureerd — mail niet verstuurd.");
      return null;
    }
    return fn(this.createTransport(config), config);
  }

  async sendPromoEmail(input: PromoMailInput) {
    const body = input.bodyTemplate
      .replace(/\{\{firstName\}\}/g, input.firstName)
      .replace(/\{\{lastName\}\}/g, input.lastName)
      .replace(/\{\{discountCode\}\}/g, input.discountCode);

    const sent = await this.withTransport(async (transport, config) => {
      const fromAddress = config.fromEmail || input.replyTo;
      await transport.sendMail({
        from: `"${input.fromName || config.fromName}" <${fromAddress}>`,
        to: input.to,
        replyTo: input.replyTo || fromAddress,
        subject: input.subject,
        text: body
      });
      return true;
    });

    return Boolean(sent);
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

    const sent = await this.withTransport(async (transport, config) => {
      const fromAddress = config.fromEmail || input.replyTo;
      await transport.sendMail({
        from: `"${input.fromName || config.fromName}" <${fromAddress}>`,
        to: input.to,
        replyTo: input.email || input.replyTo,
        subject: input.subject,
        text: body
      });
      return true;
    });

    return Boolean(sent);
  }

  async sendCateringNotificationEmail(input: {
    to: string;
    fromName: string;
    replyTo: string;
    subject: string;
    body: string;
  }) {
    const sent = await this.withTransport(async (transport, config) => {
      const fromAddress = config.fromEmail || input.replyTo;
      await transport.sendMail({
        from: `"${input.fromName || config.fromName}" <${fromAddress}>`,
        to: input.to,
        replyTo: input.replyTo || fromAddress,
        subject: input.subject,
        text: input.body
      });
      return true;
    });

    return Boolean(sent);
  }

  async sendTestEmail(input: { to: string; fromName: string; fromEmail?: string }) {
    try {
      const config = await this.resolveConfig();
      if (!config) {
        return {
          ok: false,
          message: "SMTP is niet geconfigureerd. Vul host, gebruiker en wachtwoord in, of zet SMTP_* in .env."
        };
      }

      const fromAddress = input.fromEmail || config.fromEmail || config.user;
      await this.createTransport(config).sendMail({
        from: `"${input.fromName || config.fromName}" <${fromAddress}>`,
        to: input.to,
        subject: "Tres Amigos — testmail",
        text: [
          "Dit is een testmail van Tres Amigos admin.",
          "",
          `Bron: ${config.source === "db" ? "Integraties (mailrelay)" : "Omgevingsvariabelen (.env)"}`,
          `Host: ${config.host}:${config.port}`,
          `Verstuurd om: ${new Date().toLocaleString("nl-NL")}`
        ].join("\n")
      });

      return { ok: true, message: `Testmail verstuurd naar ${input.to}.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Testmail mislukt.";
      this.logger.error(`Testmail mislukt: ${message}`);
      return { ok: false, message };
    }
  }
}
