import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { NewsletterSubscribeInput } from "@tresamigos/types";
import { cleanText } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(input: NewsletterSubscribeInput) {
    const email = cleanText(input?.email, "", 180).toLowerCase();
    const name = cleanText(input?.name, "", 120);

    if (!email || !email.includes("@")) {
      throw new BadRequestException({ message: "Vul een geldig e-mailadres in." });
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (name && !existing.name) {
        await this.prisma.newsletterSubscriber.update({
          where: { email },
          data: { name }
        });
      }
      return {
        message: "Je bent al ingeschreven voor de nieuwsbrief.",
        alreadySubscribed: true
      };
    }

    await this.prisma.newsletterSubscriber.create({
      data: { email, name }
    });

    return {
      message: "Bedankt voor je inschrijving.",
      alreadySubscribed: false
    };
  }

  async list() {
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" }
    });

    return {
      subscribers: subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name,
        subscribedAt: subscriber.subscribedAt.toISOString()
      }))
    };
  }

  async remove(email: string) {
    const normalized = cleanText(email, "", 180).toLowerCase();
    if (!normalized) {
      throw new BadRequestException({ message: "E-mailadres ontbreekt." });
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email: normalized } });
    if (!existing) {
      throw new NotFoundException({ message: "Abonnee niet gevonden." });
    }

    await this.prisma.newsletterSubscriber.delete({ where: { email: normalized } });
    return { message: "Abonnee verwijderd." };
  }
}
