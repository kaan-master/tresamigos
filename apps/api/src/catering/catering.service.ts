import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  CateringBoxId,
  CateringFulfillment,
  CateringOrder,
  CateringOrderStatus,
  CreateCateringOrderInput,
  SiteContent,
  UpdateCateringOrderInput
} from "@tresamigos/types";
import { sanitizeCateringOrder, sanitizeUpdateCateringOrderInput } from "@tresamigos/utils";
import { ContentService } from "../content/content.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class CateringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
    private readonly mailService: MailService
  ) {}

  private toDto(record: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    boxId: string;
    quantity: number;
    proteins: string[];
    toppings: string[];
    salsas: string[];
    diet: string[];
    notes: string;
    fulfillment: string;
    locationId: string;
    locationName: string;
    address: string;
    eventDate: string;
    eventTime: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    adminNotes: string;
  }): CateringOrder {
    return sanitizeCateringOrder({
      id: record.id,
      orderNumber: record.orderNumber,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      status: record.status as CateringOrderStatus,
      boxId: record.boxId as CateringBoxId,
      quantity: record.quantity,
      proteins: record.proteins,
      toppings: record.toppings,
      salsas: record.salsas,
      diet: record.diet,
      notes: record.notes,
      fulfillment: record.fulfillment as CateringFulfillment,
      locationId: record.locationId,
      locationName: record.locationName,
      address: record.address,
      eventDate: record.eventDate,
      eventTime: record.eventTime,
      name: record.name,
      email: record.email,
      phone: record.phone,
      company: record.company,
      adminNotes: record.adminNotes
    });
  }

  private async nextOrderNumber() {
    const count = await this.prisma.cateringOrder.count();
    return `CAT-${String(count + 1).padStart(5, "0")}`;
  }

  private resolveLocationName(content: SiteContent, locationId: string) {
    if (!locationId) return "";
    const location = content.locations.find((item) => item.id === locationId);
    return location?.name || "";
  }

  async create(input: CreateCateringOrderInput) {
    const order = sanitizeCateringOrder(input);

    if (!order.boxId || !order.name || !order.email || !order.email.includes("@")) {
      throw new BadRequestException({ message: "Vul alle verplichte velden in." });
    }
    if (order.quantity < 5 || order.quantity > 200) {
      throw new BadRequestException({ message: "Kies tussen 5 en 200 gasten." });
    }
    if (!order.proteins.length) {
      throw new BadRequestException({ message: "Selecteer minimaal één eiwit of vulling." });
    }
    if (!order.eventDate || !order.eventTime) {
      throw new BadRequestException({ message: "Kies een datum en tijd." });
    }
    if (order.fulfillment === "pickup" && !order.locationId) {
      throw new BadRequestException({ message: "Kies een afhaallocatie." });
    }
    if (order.fulfillment === "delivery" && order.address.length < 8) {
      throw new BadRequestException({ message: "Vul een volledig bezorgadres in." });
    }

    const content = await this.contentService.getContent();
    const locationName = this.resolveLocationName(content, order.locationId);

    const record = await this.prisma.cateringOrder.create({
      data: {
        orderNumber: await this.nextOrderNumber(),
        status: "nieuw",
        boxId: order.boxId,
        quantity: order.quantity,
        proteins: order.proteins,
        toppings: order.toppings,
        salsas: order.salsas,
        diet: order.diet,
        notes: order.notes,
        fulfillment: order.fulfillment,
        locationId: order.locationId,
        locationName,
        address: order.address,
        eventDate: order.eventDate,
        eventTime: order.eventTime,
        name: order.name,
        email: order.email,
        phone: order.phone,
        company: order.company
      }
    });

    const dto = this.toDto(record);
    void this.notifyOwner(content, dto);

    const excess = await this.prisma.cateringOrder.findMany({
      orderBy: { createdAt: "desc" },
      skip: 500,
      select: { id: true }
    });
    if (excess.length) {
      await this.prisma.cateringOrder.deleteMany({
        where: { id: { in: excess.map((item) => item.id) } }
      });
    }

    return {
      message: "Je cateringbestelling is ontvangen.",
      order: {
        id: dto.id,
        orderNumber: dto.orderNumber,
        createdAt: dto.createdAt
      }
    };
  }

  private async notifyOwner(content: SiteContent, order: CateringOrder) {
    const inbox = content.site.footer.email || content.site.mailRelay.replyTo;
    if (!inbox) return;

    const boxLabels: Record<string, string> = {
      "burrito-box": "Burrito Box",
      "bowl-box": "Bowl & Salad Box",
      "quesadilla-box": "Quesadilla Box",
      "taco-box": "Taco Box"
    };

    await this.mailService.sendCateringNotificationEmail({
      to: inbox,
      fromName: content.site.mailRelay.fromName,
      replyTo: order.email || content.site.mailRelay.replyTo,
      subject: `Nieuwe cateringbestelling ${order.orderNumber}`,
      body: [
        `Nieuwe cateringbestelling ${order.orderNumber}`,
        "",
        `Type: ${boxLabels[order.boxId] || order.boxId}`,
        `Gasten: ${order.quantity}`,
        `Datum/tijd: ${order.eventDate} ${order.eventTime}`,
        `Afhandeling: ${order.fulfillment === "pickup" ? "Afhalen" : "Bezorgen"}`,
        order.fulfillment === "pickup"
          ? `Locatie: ${order.locationName || order.locationId || "-"}`
          : `Adres: ${order.address}`,
        "",
        `Klant: ${order.name}`,
        `E-mail: ${order.email}`,
        `Telefoon: ${order.phone || "-"}`,
        order.company ? `Bedrijf: ${order.company}` : "",
        "",
        `Eiwitten: ${order.proteins.join(", ")}`,
        `Toppings: ${order.toppings.join(", ") || "-"}`,
        `Salsa's: ${order.salsas.join(", ") || "-"}`,
        `Dieet: ${order.diet.join(", ") || "-"}`,
        order.notes ? `Opmerkingen: ${order.notes}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    });
  }

  async list(): Promise<{ orders: CateringOrder[] }> {
    const records = await this.prisma.cateringOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return {
      orders: records.map((record) => this.toDto(record))
    };
  }

  async update(id: string, input: UpdateCateringOrderInput) {
    const patch = sanitizeUpdateCateringOrderInput(input);
    const existing = await this.prisma.cateringOrder.findUnique({ where: { id } });
    if (!existing) {
      throw new BadRequestException({ message: "Cateringbestelling niet gevonden." });
    }

    const record = await this.prisma.cateringOrder.update({
      where: { id },
      data: {
        status: patch.status || existing.status,
        adminNotes: patch.adminNotes === undefined ? existing.adminNotes : patch.adminNotes
      }
    });

    return this.toDto(record);
  }
}
