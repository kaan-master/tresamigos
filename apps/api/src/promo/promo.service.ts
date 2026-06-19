import { BadRequestException, Injectable } from "@nestjs/common";
import type { PromoSubscribeInput } from "@tresamigos/types";
import { cleanText } from "@tresamigos/utils";
import { ContentService } from "../content/content.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
    private readonly mailService: MailService
  ) {}

  async subscribe(input: PromoSubscribeInput) {
    const firstName = cleanText(input?.firstName, "", 80);
    const lastName = cleanText(input?.lastName, "", 80);
    const email = cleanText(input?.email, "", 180).toLowerCase();

    if (!firstName || !lastName || !email || !email.includes("@")) {
      throw new BadRequestException({ message: "Vul voornaam, achternaam en een geldig e-mailadres in." });
    }

    const content = await this.contentService.getContent();
    const promo = content.site.promoPopup;
    const mail = content.site.mailRelay;

    if (!promo.enabled) {
      throw new BadRequestException({ message: "Deze actie is momenteel niet beschikbaar." });
    }

    const existing = await this.prisma.promoLead.findUnique({ where: { email } });
    if (!existing) {
      await this.prisma.promoLead.create({
        data: { firstName, lastName, email }
      });
    }

    if (mail.enabled && this.mailService.isConfigured()) {
      await this.mailService.sendPromoEmail({
        to: email,
        firstName,
        lastName,
        discountCode: promo.discountCode,
        fromName: mail.fromName,
        replyTo: mail.replyTo,
        subject: mail.subject,
        bodyTemplate: mail.bodyTemplate
      });
    }

    return {
      message: promo.successMessage,
      emailed: mail.enabled && this.mailService.isConfigured()
    };
  }
}
