import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  FRANCHISE_SHOP_ORDER_CHANNELS,
  FRANCHISE_SHOP_ORDER_CHANNEL_LABELS,
  FRANCHISE_SHOP_ORDER_STATUSES,
  FRANCHISE_SHOP_ORDER_STATUS_LABELS,
  emptyFranchiseShopOrderFlow,
  franchiseShopOrderActionDef,
  franchiseShopOrderActions,
  franchiseShopOrderQuestion,
  normalizeFranchiseShopOrderStatus,
  parseFranchiseShopOrderFlow,
  type AdminCreateFranchiseShopOrderInput,
  type ApplyFranchiseShopOrderActionInput,
  type CreateFranchiseAccountInput,
  type CreateFranchiseShopOrderInput,
  type CreateFranchiseShopProductInput,
  type FranchiseAccount,
  type FranchiseShopCatalogProduct,
  type FranchiseShopOrder,
  type FranchiseShopOrderAction,
  type FranchiseShopOrderChannel,
  type FranchiseShopOrderFlow,
  type FranchiseShopOrderStatus,
  type FranchiseShopProduct,
  type UpdateFranchiseAccountInput,
  type UpdateFranchiseShopOrderInput,
  type UpdateFranchiseShopProductInput
} from "@tresamigos/types";
import { buildOrderPdf, pdfFilename, type PdfDocKind } from "../documents/order-pdf";
import { MailService } from "../mail/mail.service";
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

function asChannel(value: unknown): FranchiseShopOrderChannel {
  return (FRANCHISE_SHOP_ORDER_CHANNELS as readonly string[]).includes(String(value || ""))
    ? (value as FranchiseShopOrderChannel)
    : "portaal";
}

@Injectable()
export class FranchiseShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: FranchiseShopAuthService,
    private readonly mail: MailService
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
    channel?: string;
    flow?: unknown;
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
    const status = normalizeFranchiseShopOrderStatus(record.status);
    const channel = asChannel(record.channel);
    const flow = parseFranchiseShopOrderFlow(record.flow, channel);
    flow.channel = channel;
    return {
      id: record.id,
      orderNumber: record.orderNumber,
      invoiceNumber: record.invoiceNumber,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      status,
      channel,
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
        })),
      flow,
      nextActions: franchiseShopOrderActions(status),
      question: franchiseShopOrderQuestion(status)
    };
  }

  private appendFlowEvent(
    flow: FranchiseShopOrderFlow,
    event: FranchiseShopOrderFlow["events"][number]
  ): FranchiseShopOrderFlow {
    return { ...flow, events: [...flow.events, event].slice(-40) };
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

  private async buildOrderItems(
    locationId: string,
    lines: Array<{ productId?: string; quantity?: number }>,
    options?: { allowEmpty?: boolean }
  ) {
    const sliced = Array.isArray(lines) ? lines.slice(0, 40) : [];
    if (!sliced.length) {
      if (options?.allowEmpty) return [];
      throw new BadRequestException({ message: "Winkelwagen is leeg." });
    }

    const productIds = [...new Set(sliced.map((line) => cleanText(line.productId, "", 80)).filter(Boolean))];
    const products = await this.prisma.franchiseShopProduct.findMany({
      where: { id: { in: productIds }, active: true },
      include: { prices: { where: { locationId } } }
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

    for (const [index, line] of sliced.entries()) {
      const productId = cleanText(line.productId, "", 80);
      const quantity = Math.min(999, Math.max(1, Math.round(Number(line.quantity) || 0)));
      const product = byId.get(productId);
      const price = product?.prices[0];
      if (!product || !price) {
        throw new BadRequestException({ message: "Geen prijs voor product in deze franchise." });
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
    return orderItems;
  }

  private initialFlow(channel: FranchiseShopOrderChannel, status: FranchiseShopOrderStatus, note?: string) {
    const flow = emptyFranchiseShopOrderFlow(channel);
    return this.appendFlowEvent(flow, {
      at: new Date().toISOString(),
      action: "registered",
      fromStatus: "",
      toStatus: status,
      note
    });
  }

  async placeOrder(session: FranchiseShopSessionPayload, input: CreateFranchiseShopOrderInput) {
    const notes = cleanText(input?.notes, "", 1000);
    const orderItems = await this.buildOrderItems(session.locationId, input?.items || []);
    const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const orderNumber = await this.nextOrderNumber();
    const invoiceNumber = await this.nextInvoiceNumber();
    const flow = this.initialFlow("portaal", "in_afwachting", notes || undefined);

    const record = await this.prisma.franchiseShopOrder.create({
      data: {
        orderNumber,
        invoiceNumber,
        status: "in_afwachting",
        channel: "portaal",
        flow: flow as unknown as Prisma.InputJsonValue,
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

  async createAdminOrder(input: AdminCreateFranchiseShopOrderInput) {
    const account = await this.prisma.franchiseAccount.findUnique({
      where: { id: cleanText(input?.accountId, "", 80) },
      include: { location: true }
    });
    if (!account) throw new BadRequestException({ message: "Kies een franchise-account." });

    const channel = asChannel(input?.channel);
    const notes = cleanText(input?.notes, "", 1000);
    const missingData = cleanText(input?.missingData, "", 2000);
    const orderItems = await this.buildOrderItems(account.locationId, input?.items || [], { allowEmpty: true });
    const incomplete = input?.incomplete === true || !orderItems.length;
    const status: FranchiseShopOrderStatus = incomplete ? "registratie_onvolledig" : "in_afwachting";
    const flow = this.initialFlow(channel, status, missingData || notes || undefined);
    flow.missingData = missingData;
    const subtotalCents = orderItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const orderNumber = await this.nextOrderNumber();
    const invoiceNumber = orderItems.length ? await this.nextInvoiceNumber() : "";

    const record = await this.prisma.franchiseShopOrder.create({
      data: {
        orderNumber,
        invoiceNumber,
        status,
        channel,
        flow: flow as unknown as Prisma.InputJsonValue,
        accountId: account.id,
        locationId: account.locationId,
        locationName: account.location.name,
        locationCode: account.location.code,
        notes,
        subtotalCents,
        items: { create: orderItems }
      },
      include: { account: true, items: true }
    });

    return {
      order: this.toOrderDto(record),
      message: incomplete ? "Bestelling geregistreerd als onvolledig." : "Bestelling geregistreerd."
    };
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
    const existing = await this.prisma.franchiseShopOrder.findUnique({
      where: { id },
      include: { account: true, items: true }
    });
    if (!existing) throw new NotFoundException({ message: "Bestelling niet gevonden." });

    const current = this.toOrderDto(existing);
    const nextStatus = FRANCHISE_SHOP_ORDER_STATUSES.includes(cleanText(input?.status, "", 40) as FranchiseShopOrderStatus)
      ? (cleanText(input.status, "", 40) as FranchiseShopOrderStatus)
      : current.status;
    const flow =
      nextStatus !== current.status
        ? this.appendFlowEvent(current.flow, {
            at: new Date().toISOString(),
            action: "registered",
            fromStatus: current.status,
            toStatus: nextStatus,
            note: "Handmatige status"
          })
        : current.flow;

    const nextItems = Array.isArray(input.items)
      ? await this.buildOrderItems(existing.locationId, input.items, { allowEmpty: true })
      : null;

    const record = await this.prisma.franchiseShopOrder.update({
      where: { id },
      data: {
        status: nextStatus,
        adminNotes: input.adminNotes === undefined ? undefined : cleanText(input.adminNotes, "", 2000),
        flow: flow as unknown as Prisma.InputJsonValue,
        ...(nextItems
          ? {
              subtotalCents: nextItems.reduce((sum, item) => sum + item.lineTotalCents, 0),
              items: { deleteMany: {}, create: nextItems }
            }
          : {})
      },
      include: { account: true, items: true }
    });
    return { order: this.toOrderDto(record) };
  }

  async applyOrderAction(id: string, input: ApplyFranchiseShopOrderActionInput) {
    const existing = await this.prisma.franchiseShopOrder.findUnique({
      where: { id },
      include: { account: true, items: true }
    });
    if (!existing) throw new NotFoundException({ message: "Bestelling niet gevonden." });

    const current = this.toOrderDto(existing);
    const action = cleanText(input?.action, "", 40) as FranchiseShopOrderAction;
    const def = franchiseShopOrderActionDef(current.status, action);
    if (!def) {
      throw new BadRequestException({
        message: `Deze stap hoort niet bij status ${FRANCHISE_SHOP_ORDER_STATUS_LABELS[current.status]}.`
      });
    }

    const note = cleanText(input?.note, "", 2000);
    if (def.noteRequired && !note) {
      throw new BadRequestException({ message: `${def.noteLabel || "Toelichting"} is verplicht.` });
    }

    const flow = { ...current.flow };
    if (action === "request_missing_data" || action === "mark_incomplete") {
      flow.missingData = note || flow.missingData;
    }
    if (action === "require_action" || action === "resolve_action") {
      flow.kitchenNote = note || flow.kitchenNote;
    }
    if (action === "report_deviation") {
      const kind = cleanText(input?.deviationKind, "", 20);
      if (kind !== "tekort" && kind !== "schade" && kind !== "fout") {
        throw new BadRequestException({ message: "Kies tekort, schade of fout." });
      }
      flow.deviationKind = kind;
      flow.deviationNote = note;
      flow.receivedComplete = false;
    }
    if (action === "plan_nalevering") {
      flow.naleveringNote = note;
    }
    if (action === "confirm_complete_receipt") {
      flow.receivedComplete = true;
    }
    if (action === "accept_with_deviation") {
      flow.receivedComplete = false;
    }
    if (action === "update_stock") {
      flow.stockUpdatedAt = new Date().toISOString();
    }
    if (action === "complete_registration") {
      if (!current.items.length) {
        throw new BadRequestException({ message: "Voeg eerst producten toe voordat de registratie compleet is." });
      }
      flow.missingData = "";
    }

    const shouldNotify = def.notify && input?.notify !== false;
    let notified: boolean | undefined;
    if (shouldNotify) {
      notified = await this.notifyOrderAction(current, def.id, note);
    }

    const nextFlow = this.appendFlowEvent(flow, {
      at: new Date().toISOString(),
      action: def.id,
      fromStatus: current.status,
      toStatus: def.toStatus,
      note: note || undefined,
      notified
    });

    const record = await this.prisma.franchiseShopOrder.update({
      where: { id },
      data: {
        status: def.toStatus,
        channel: current.channel,
        flow: nextFlow as unknown as Prisma.InputJsonValue,
        adminNotes: note && def.tone === "danger" ? [current.adminNotes, note].filter(Boolean).join("\n") : undefined
      },
      include: { account: true, items: true }
    });

    const order = this.toOrderDto(record);
    return {
      order,
      mailSent: notified,
      message:
        notified === false
          ? `${def.label}. Mail naar de vestiging is niet verstuurd.`
          : def.label
    };
  }

  private async notifyOrderAction(
    order: FranchiseShopOrder,
    action: FranchiseShopOrderAction,
    note: string
  ): Promise<boolean> {
    const to = order.accountEmail;
    if (!to) return false;
    const channel = FRANCHISE_SHOP_ORDER_CHANNEL_LABELS[order.channel];
    const subjects: Partial<Record<FranchiseShopOrderAction, string>> = {
      request_missing_data: `Ontbrekende gegevens voor ${order.orderNumber}`,
      require_action: `Actie vereist voor ${order.orderNumber}`,
      mark_shipped: `${order.orderNumber} is onderweg`,
      confirm_order: `${order.orderNumber} is bevestigd`
    };
    const bodies: Partial<Record<FranchiseShopOrderAction, string>> = {
      request_missing_data: [
        `Voor bestelling ${order.orderNumber} (${channel}) ontbreken nog gegevens.`,
        note ? `Wat we nodig hebben:\n${note}` : "",
        "Reageer op deze mail of stuur de gegevens via WhatsApp."
      ]
        .filter(Boolean)
        .join("\n\n"),
      require_action: [
        `De productiekeuken heeft een actie nodig voor ${order.orderNumber}.`,
        note ? note : "Neem contact op over een wijziging, tekort of alternatief."
      ].join("\n\n"),
      mark_shipped: `Bestelling ${order.orderNumber} is onderweg naar ${order.locationCode} ${order.locationName}. Controleer de levering bij ontvangst.`,
      confirm_order: `Bestelling ${order.orderNumber} is bevestigd door de productiekeuken.`
    };
    const subject = subjects[action];
    const body = bodies[action];
    if (!subject || !body) return false;
    try {
      return await this.mail.sendNotificationEmail({
        to,
        subject,
        body,
        category: "franchise"
      });
    } catch {
      return false;
    }
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
    const statusLabel = FRANCHISE_SHOP_ORDER_STATUS_LABELS[order.status];
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
