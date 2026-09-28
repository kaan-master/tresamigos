import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import type { CreateFranchiseInquiryInput, FranchiseInquiry } from "@tresamigos/types";
import { sanitizeFranchiseInquiry } from "@tresamigos/utils";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class FranchiseService {
  private readonly logger = new Logger(FranchiseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  private toDto(record: {
    id: string;
    createdAt: Date;
    status: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    desiredLocation: string;
    currentRole: string;
    company: string;
    investment: string;
    financing: string;
    visitedLocation: string;
    termsAccepted: boolean;
  }): FranchiseInquiry {
    return sanitizeFranchiseInquiry({
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      status: record.status,
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address,
      desiredLocation: record.desiredLocation,
      currentRole: record.currentRole,
      company: record.company,
      investment: record.investment,
      financing: record.financing,
      visitedLocation: record.visitedLocation,
      termsAccepted: record.termsAccepted
    });
  }

  async create(input: CreateFranchiseInquiryInput) {
    const inquiry = sanitizeFranchiseInquiry(input);
    if (!inquiry.name || !inquiry.email || !inquiry.termsAccepted) {
      throw new BadRequestException({
        message: "Naam, e-mail en akkoord met de voorwaarden zijn verplicht."
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email)) {
      throw new BadRequestException({ message: "Vul een geldig e-mailadres in." });
    }

    await this.prisma.franchiseInquiry.create({
      data: {
        id: inquiry.id,
        createdAt: new Date(inquiry.createdAt),
        status: inquiry.status,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        address: inquiry.address,
        desiredLocation: inquiry.desiredLocation,
        currentRole: inquiry.currentRole,
        company: inquiry.company,
        investment: inquiry.investment,
        financing: inquiry.financing,
        visitedLocation: inquiry.visitedLocation,
        termsAccepted: inquiry.termsAccepted
      }
    });

    void this.notifyTeam(inquiry);

    const excess = await this.prisma.franchiseInquiry.findMany({
      orderBy: { createdAt: "desc" },
      skip: 500,
      select: { id: true }
    });
    if (excess.length) {
      await this.prisma.franchiseInquiry.deleteMany({
        where: { id: { in: excess.map((item) => item.id) } }
      });
    }

    return {
      message: "Je franchise-aanvraag is ontvangen. We nemen contact met je op.",
      inquiry: {
        id: inquiry.id,
        createdAt: inquiry.createdAt
      }
    };
  }

  async list(): Promise<{ inquiries: FranchiseInquiry[] }> {
    const records = await this.prisma.franchiseInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return { inquiries: records.map((record) => this.toDto(record)) };
  }

  private async notifyTeam(inquiry: FranchiseInquiry) {
    try {
      const to = await this.mailService.getNotifyEmail("franchise");
      await this.mailService.sendNotificationEmail({
        to,
        replyTo: inquiry.email,
        subject: `Nieuwe franchise-aanvraag — ${inquiry.name}`,
        body: [
          "Nieuwe franchise-aanvraag via tresamigos.nl",
          "",
          `Naam: ${inquiry.name}`,
          `E-mail: ${inquiry.email}`,
          `Telefoon: ${inquiry.phone || "-"}`,
          `Adres: ${inquiry.address || "-"}`,
          `Gewenste locatie: ${inquiry.desiredLocation || "-"}`,
          `Huidige rol: ${inquiry.currentRole || "-"}`,
          `Bedrijf: ${inquiry.company || "-"}`,
          `Investering: ${inquiry.investment || "-"}`,
          `Financiering: ${inquiry.financing || "-"}`,
          `Bezochte vestiging: ${inquiry.visitedLocation || "-"}`
        ].join("\n")
      });
    } catch (error) {
      this.logger.warn(`Franchise-mail mislukt: ${error instanceof Error ? error.message : "onbekend"}`);
    }
  }
}
