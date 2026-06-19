import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

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

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  private createTransport() {
    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendPromoEmail(input: PromoMailInput) {
    if (!this.isConfigured()) {
      this.logger.warn("SMTP niet geconfigureerd — promo mail niet verstuurd.");
      return false;
    }

    const body = input.bodyTemplate
      .replace(/\{\{firstName\}\}/g, input.firstName)
      .replace(/\{\{lastName\}\}/g, input.lastName)
      .replace(/\{\{discountCode\}\}/g, input.discountCode);

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || input.replyTo;

    await this.createTransport().sendMail({
      from: `"${input.fromName}" <${fromAddress}>`,
      to: input.to,
      replyTo: input.replyTo || fromAddress,
      subject: input.subject,
      text: body
    });

    return true;
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
    if (!this.isConfigured()) {
      this.logger.warn("SMTP niet geconfigureerd — contact mail niet verstuurd.");
      return false;
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || input.replyTo;
    const body = [
      "Nieuw contactbericht via tresamigos.nl",
      "",
      `Naam: ${input.name}`,
      `E-mail: ${input.email}`,
      `Onderwerp: ${input.topic}`,
      "",
      input.message
    ].join("\n");

    await this.createTransport().sendMail({
      from: `"${input.fromName}" <${fromAddress}>`,
      to: input.to,
      replyTo: input.email || input.replyTo,
      subject: input.subject,
      text: body
    });

    return true;
  }
}
