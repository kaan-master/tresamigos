import { BadRequestException, Injectable } from "@nestjs/common";
import type { CreateFranchiseInquiryInput, FranchiseInquiry } from "@tresamigos/types";
import { sanitizeFranchiseInquiry } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class FranchiseService {
  constructor(private readonly prisma: PrismaService) {}

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
        visitedLocation: inquiry.visitedLocation,
        termsAccepted: inquiry.termsAccepted
      }
    });

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
}
