import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  FRANCHISE_SHOP_ORDER_STATUSES,
  type CreateFranchiseAccountInput,
  type CreateFranchiseShopOrderInput,
  type CreateFranchiseShopProductInput,
  type FranchiseAccount,
  type FranchiseShopCatalogProduct,
  type FranchiseShopOrder,
  type FranchiseShopOrderStatus,
  type FranchiseShopProduct,
  type UpdateFranchiseAccountInput,
  type UpdateFranchiseShopOrderInput,
  type UpdateFranchiseShopProductInput
} from "@tresamigos/types";
import { buildOrderPdf, pdfFilename, type PdfDocKind } from "../documents/order-pdf";
import { FranchiseShopAuthService, type FranchiseShopSessionPayload } from "./franchise-shop-auth.service";
import { PrismaService } from "../prisma/prisma.module";

function cleanText(value: unknown, fallback = "", max = 200) {
  return String(value ?? fallback)
    .trim()
    .slice(0, max);
}

function moneyCents(value: unknown) {
  const number = Math.round(Number(value) || 0);
  return Math.max(0, Math.min(10_000_000, number));
}

@Injectable()
export class FranchiseShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FranchiseShopAuthService
  ) {}

  private toAccountDto(record: {
    id: string;
    email: string;
    name: string;
    locationId: string;
    company: string;
    vatId: string;
    kvk: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    location: { name: string; code: string };
  }): FranchiseAccount {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      locationId: record.locationId,
      locationName: record.location.name,
      locationCode: record.location.code,
      company: record.company || "",
      vatId: record.vatId || "",
      kvk: record.kvk || "",
      active: record.active,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toProductDto(record: {
    id: string;
    name: string;
    description: string;
    image: string;
    sku: string;
    active: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    prices: Array<{ locationId: string; priceCents: number }>;
  }): FranchiseShopProduct {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      image: record.image,
      sku: record.sku,
      active: record.active,
      sortOrder: record.sortOrder,
      prices: Object.fromEntries(record.prices.map((price) => [price.locationId, price.priceCents])),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toOrderDto(record: {
    id: string;
    orderNumber: string;
    invoiceNumber: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    accountId: string;
    locationId: string;
    locationName: string;
    locationCode: string;
    notes: string;
    adminNotes: string;
    subtotalCents: number;
    account: { name: string; email: string; company?: string; vatId?: string; kvk?: string };
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
      sortOrder: number;
    }>;
  }): FranchiseShopOrder {
    const status = FRANCHISE_SHOP_ORDER_STATUSES.includes(record.status as FranchiseShopOrderStatus)
      ? (record.status as FranchiseShopOrderStatus)
      : "nieuw";
    return {
      id: record.id,
      orderNumber: record.orderNumber,
      invoiceNumber: record.invoiceNumber,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      status,
      accountId: record.accountId,
      accountName: record.account.name,
      accountEmail: record.account.email,
      accountCompany: record.account.company || "",
      accountVatId: record.account.vatId || "",
      accountKvk: record.account.kvk || "",
      locationId: record.locationId,
      locationName: record.locationName,
      locationCode: record.locationCode,
      notes: record.notes,
      adminNotes: record.adminNotes,
      subtotalCents: record.subtotalCents,
      items: [...record.items]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents
        }))
    };
  }

  async listAccounts() {
    const records = await this.prisma.franchiseAccount.findMany({
      include: { location: true },
      orderBy: { name: "asc" }
    });
    return { accounts: records.map((record) => this.toAccountDto(record)) };
  }

  async createAccount(input: CreateFranchiseAccountInput) {
    const email = cleanText(input?.email, "", 180).toLowerCase();
    const name = cleanText(input?.name, "", 160);
    const password = String(input?.password || "");
    const locationId = cleanText(input?.locationId, "", 80);
    if (!email.includes("@") || !name || password.length < 8 || !locationId) {
      throw new BadRequestException({ message: "Naam, e-mail, wachtwoord (min. 8) en vestiging zijn verplicht." });
    }
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new BadRequestException({ message: "Vestiging niet gevonden." });

    const record = await this.prisma.franchiseAccount.create({
      data: {
        email,
        name,
        passwordHash: this.auth.hash(password),
        locationId,
        company: cleanText(input?.company, "", 160),
        vatId: cleanText(input?.vatId, "", 40).toUpperCase(),
        kvk: cleanText(input?.kvk, "", 40),
        active: input.active !== false
      },
      include: { location: true }
    });
    return { account: this.toAccountDto(record) };
  }

  async updateAccount(id: string, input: UpdateFranchiseAccountInput) {
    const existing = await this.prisma.franchiseAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: "Account niet gevonden." });

    const data: {
      email?: string;
      name?: string;
      passwordHash?: string;
      locationId?: string;
      company?: string;
      vatId?: string;
      kvk?: string;
      active?: boolean;
    } = {};

    if (input.email !== undefined) {
      const email = cleanText(input.email, "", 180).toLowerCase();
      if (!email.includes("@")) throw new BadRequestException({ message: "Vul een geldig e-mailadres in." });
      data.email = email;
    }
    if (input.name !== undefined) data.name = cleanText(input.name, "", 160);
    if (input.password) {
      if (input.password.length < 8) throw new BadRequestException({ message: "Wachtwoord min. 8 tekens." });
      data.passwordHash = this.auth.hash(input.password);
    }
    if (input.locationId !== undefined) {
      const location = await this.prisma.location.findUnique({ where: { id: input.locationId } });
      if (!location) throw new BadRequestException({ message: "Vestiging niet gevonden." });
      data.locationId = input.locationId;
    }
    if (input.company !== undefined) data.company = cleanText(input.company, "", 160);
    if (input.vatId !== undefined) data.vatId = cleanText(input.vatId, "", 40).toUpperCase();
    if (input.kvk !== undefined) data.kvk = cleanText(input.kvk, "", 40);
    if (input.active !== undefined) data.active = input.active;

    const record = await this.prisma.franchiseAccount.update({
      where: { id },
      data,
      include: { location: true }
    });
    return { account: this.toAccountDto(record) };
  }

  async listProducts() {
    const records = await this.prisma.franchiseShopProduct.findMany({
      include: { prices: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
    return { products: records.map((record) => this.toProductDto(record)) };
  }

  async createProduct(input: CreateFranchiseShopProductInput) {
    const name = cleanText(input?.name, "", 160);
    if (!name) throw new BadRequestException({ message: "Productnaam is verplicht." });
    const count = await this.prisma.franchiseShopProduct.count();
    const prices = input.prices || {};

    const record = await this.prisma.franchiseShopProduct.create({
      data: {
        name,
        description: cleanText(input?.description, "", 1000),
        image: cleanText(input?.image, "", 500),
        sku: cleanText(input?.sku, "", 80),
        active: input.active !== false,
        sortOrder: count,
        prices: {
          create: Object.entries(prices).map(([locationId, priceCents]) => ({
            locationId,
            priceCents: moneyCents(priceCents)
          }))
        }
      },
      include: { prices: true }
    });
    return { product: this.toProductDto(record) };
  }

  async updateProduct(id: string, input: UpdateFranchiseShopProductInput) {
    const existing = await this.prisma.franchiseShopProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: "Product niet gevonden." });

    await this.prisma.$transaction(async (tx) => {
      await tx.franchiseShopProduct.update({
        where: { id },
        data: {
          name: input.name === undefined ? undefined : cleanText(input.name, existing.name, 160),
          description: input.description === undefined ? undefined : cleanText(input.description, "", 1000),
          image: input.image === undefined ? undefined : cleanText(input.image, "", 500),
          sku: input.sku === undefined ? undefined : cleanText(input.sku, "", 80),
          active: input.active,
          sortOrder: input.sortOrder === undefined ? undefined : Math.max(0, Number(input.sortOrder) || 0)
        }
      });

      if (input.prices) {
        for (const [locationId, priceCents] of Object.entries(input.prices)) {
          await tx.franchiseProductPrice.upsert({
            where: { productId_locationId: { productId: id, locationId } },
            create: { productId: id, locationId, priceCents: moneyCents(priceCents) },
            update: { priceCents: moneyCents(priceCents) }
          });
        }
      }
    });

    const record = await this.prisma.franchiseShopProduct.findUnique({
      where: { id },
      include: { prices: true }
    });
    return { product: this.toProductDto(record!) };
  }

  async deleteProduct(id: string) {
    await this.prisma.franchiseShopProduct.delete({ where: { id } }).catch(() => {
      throw new NotFoundException({ message: "Product niet gevonden." });
    });
    return { message: "Product verwijderd." };
  }

  async catalogForLocation(locationId: string): Promise<{ products: FranchiseShopCatalogProduct[] }> {
    const records = await this.prisma.franchiseShopProduct.findMany({
      where: { active: true },
      include: { prices: { where: { locationId } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
    return {
      products: records
        .filter((product) => product.prices[0])
        .map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          sku: product.sku,
          priceCents: product.prices[0].priceCents
        }))
    };
  }

  private async nextOrderNumber() {
    const count = await this.prisma.franchiseShopOrder.count();
    return `FS-${String(count + 1).padStart(5, "0")}`;
  }

  private async nextInvoiceNumber() {
    const count = await this.prisma.franchiseShopOrder.count({ where: { invoiceNumber: { not: "" } } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  async placeOrder(session: FranchiseShopSessionPayload, input: CreateFranchiseShopOrderInput) {
    const notes = cleanText(input?.notes, "", 1000);
    const lines = Array.isArray(input?.items) ? input.items.slice(0, 40) : [];
    if (!lines.length) throw new BadRequestException({ message: "Winkelwagen is leeg." });

    const productIds = [...new Set(lines.map((line) => cleanText(line.productId, "", 80)).filter(Boolean))];
    const products = await this.prisma.franchiseShopProduct.findMany({
      where: { id: { in: productIds }, active: true },
      include: { prices: { where: { locationId: session.locationId } } }
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    const orderItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
      sortOrder: number;
    }> = [];

    for (const [index, line] of lines.entries()) {
      const productId = cleanText(line.productId, "", 80);
      const quantity = Math.min(999, Math.max(1, Math.round(Number(line.quantity) || 0)));
      const product = byId.get(productId);
      const price = product?.prices[0];
      if (!product || !price) {
        throw new BadRequestException({ message: `Geen prijs voor product in deze franchise.` });
      }
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPriceCents: price.priceCents,
        lineTotalCents: price.priceCents * quantity,
        sortOrder: index
      });
    }

    const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const orderNumber = await this.nextOrderNumber();
    const invoiceNumber = await this.nextInvoiceNumber();

    const record = await this.prisma.franchiseShopOrder.create({
      data: {
        orderNumber,
        invoiceNumber,
        status: "nieuw",
        accountId: session.accountId,
        locationId: session.locationId,
        locationName: session.locationName,
        locationCode: session.locationCode,
        notes,
        subtotalCents,
        items: { create: orderItems }
      },
      include: { account: true, items: true }
    });

    return { order: this.toOrderDto(record), message: "Bestelling geplaatst." };
  }

  async listOrders() {
    const records = await this.prisma.franchiseShopOrder.findMany({
      include: { account: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 500
    });
    return { orders: records.map((record) => this.toOrderDto(record)) };
  }

  async listMyOrders(accountId: string) {
    const records = await this.prisma.franchiseShopOrder.findMany({
      where: { accountId },
      include: { account: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return { orders: records.map((record) => this.toOrderDto(record)) };
  }

  async updateOrder(id: string, input: UpdateFranchiseShopOrderInput) {
    const existing = await this.prisma.franchiseShopOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: "Bestelling niet gevonden." });

    const status = cleanText(input?.status, "", 40);
    const record = await this.prisma.franchiseShopOrder.update({
      where: { id },
      data: {
        status: FRANCHISE_SHOP_ORDER_STATUSES.includes(status as FranchiseShopOrderStatus) ? status : undefined,
        adminNotes: input.adminNotes === undefined ? undefined : cleanText(input.adminNotes, "", 2000)
      },
      include: { account: true, items: true }
    });
    return { order: this.toOrderDto(record) };
  }

  async getOrderDocument(id: string, kind: PdfDocKind) {
    const record = await this.prisma.franchiseShopOrder.findUnique({
      where: { id },
      include: { account: true, items: true }
    });
    if (!record) throw new NotFoundException({ message: "Bestelling niet gevonden." });

    let invoiceNumber = record.invoiceNumber;
    if (kind === "invoice" && !invoiceNumber) {
      invoiceNumber = await this.nextInvoiceNumber();
      await this.prisma.franchiseShopOrder.update({
        where: { id },
        data: { invoiceNumber }
      });
    }

    const order = this.toOrderDto({ ...record, invoiceNumber });
    const statusLabel = order.status;
    const buffer = await buildOrderPdf({
      kind,
      channel: "franchise",
      title: kind === "invoice" ? "Factuur" : "Pakbon",
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber || undefined,
      createdAt: order.createdAt,
      statusLabel,
      notes: order.notes || order.adminNotes || undefined,
      customer: {
        name: order.accountName,
        email: order.accountEmail,
        company: order.accountCompany,
        vatId: order.accountVatId,
        kvk: order.accountKvk,
        locationLabel: `${order.locationCode} ${order.locationName}`.trim()
      },
      lines: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents
      })),
      subtotalCents: order.subtotalCents,
      meta: [{ label: "Franchise", value: `${order.locationCode} ${order.locationName}`.trim() }]
    });

    return {
      buffer,
      filename: pdfFilename(kind, kind === "invoice" ? order.invoiceNumber || order.orderNumber : order.orderNumber)
    };
  }
}
