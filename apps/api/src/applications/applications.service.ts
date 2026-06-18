import { BadRequestException, Injectable } from "@nestjs/common";
import type { Application, CreateApplicationInput } from "@tresamigos/types";
import { sanitizeApplication } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(record: {
    id: string;
    createdAt: Date;
    status: string;
    role: string;
    name: string;
    email: string;
    phone: string;
    days: string[];
    availabilityNote: string;
    experience: string;
    motivation: string;
    pdfName: string | null;
    pdfSize: number | null;
    pdfData: string | null;
  }): Application {
    return sanitizeApplication({
      id: record.id,
      createdAt: record.createdAt.toISOString(),
      status: record.status,
      role: record.role as Application["role"],
      name: record.name,
      email: record.email,
      phone: record.phone,
      days: record.days as Application["days"],
      availabilityNote: record.availabilityNote,
      experience: record.experience,
      motivation: record.motivation,
      pdf:
        record.pdfName && record.pdfData
          ? {
              name: record.pdfName,
              size: record.pdfSize || 0,
              data: record.pdfData
            }
          : null
    });
  }

  async create(input: CreateApplicationInput) {
    const application = sanitizeApplication(input);
    if (!application.name || !application.email || !application.days.length) {
      throw new BadRequestException({
        message: "Naam, e-mail en minimaal een dag zijn verplicht."
      });
    }

    await this.prisma.application.create({
      data: {
        id: application.id,
        createdAt: new Date(application.createdAt),
        status: application.status,
        role: application.role,
        name: application.name,
        email: application.email,
        phone: application.phone,
        days: application.days,
        availabilityNote: application.availabilityNote,
        experience: application.experience,
        motivation: application.motivation,
        pdfName: application.pdf?.name || null,
        pdfSize: application.pdf?.size || null,
        pdfData: application.pdf?.data || null
      }
    });

    const excess = await this.prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      skip: 500,
      select: { id: true }
    });
    if (excess.length) {
      await this.prisma.application.deleteMany({
        where: { id: { in: excess.map((item) => item.id) } }
      });
    }

    return {
      message: "Je sollicitatie is ontvangen.",
      application: {
        id: application.id,
        createdAt: application.createdAt
      }
    };
  }

  async list(): Promise<{ applications: Application[] }> {
    const records = await this.prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return {
      applications: records.map((record) => this.toDto(record))
    };
  }
}
