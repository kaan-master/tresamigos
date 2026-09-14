import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  COUNT_SHIFTS,
  COUNT_STATUSES,
  type CountCategory,
  type CountLine,
  type CountLineInput,
  type CountList,
  type CountCategoryStat,
  type CountListFilters,
  type CountLocationOption,
  type CountProductStat,
  type CreateCountListInput,
  type UpdateCountListInput,
  type CountProduct,
  type CountSession,
  type CountSessionSummary,
  type CountShift,
  type CountStaffRecord,
  type CountStaffSessionUser,
  type CountStatus,
  type CreateCountCategoryInput,
  type CreateCountProductInput,
  type CreateCountStaffInput,
  type SaveCountSessionInput,
  type UpdateCountCategoryInput,
  type UpdateCountProductInput,
  type UpdateCountStaffInput
} from "@tresamigos/types";
import { PrismaService } from "../prisma/prisma.module";
import { TellingenAuthService } from "./tellingen-auth.service";

function todayInAmsterdam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function isDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function asShift(value: string | undefined): CountShift {
  if (value === "morning" || value === "evening") return value;
  throw new BadRequestException({ message: "Kies ochtend- of avondtelling." });
}

function asStatus(value: string): CountStatus {
  return COUNT_STATUSES.includes(value as CountStatus) ? (value as CountStatus) : "draft";
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function weekdayName(countDate: string) {
  const [year, month, day] = countDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString("nl-NL", { weekday: "long" });
}

function parseQuantity(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || number > 999_999) {
    throw new BadRequestException({ message: "Aantal is ongeldig." });
  }
  return Math.round(number * 100) / 100;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

@Injectable()
export class TellingenService {
  private readonly logger = new Logger(TellingenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: TellingenAuthService
  ) {}

  private toStaffRecord(staff: {
    id: string;
    name: string;
    loginHint: string;
    active: boolean;
    locationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    location: { name: string; code: string } | null;
  }): CountStaffRecord {
    return {
      id: staff.id,
      name: staff.name,
      loginHint: staff.loginHint,
      active: staff.active,
      locationId: staff.locationId,
      locationName: staff.location?.name || null,
      locationCode: staff.location?.code || null,
      createdAt: staff.createdAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString()
    };
  }

  private toLine(line: {
    id: string;
    productId: string | null;
    productName: string;
    categoryName: string;
    quantity: Prisma.Decimal | null;
    note: string;
    sortOrder: number;
  }): CountLine {
    return {
      id: line.id,
      productId: line.productId,
      productName: line.productName,
      categoryName: line.categoryName,
      quantity: decimalToNumber(line.quantity),
      note: line.note,
      sortOrder: line.sortOrder
    };
  }

  private toSession(session: {
    id: string;
    locationId: string;
    locationName: string;
    locationCode: string;
    listId: string;
    listTitle: string;
    staffId: string | null;
    staffName: string;
    shift: string;
    status: string;
    countDate: string;
    submittedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lines: Array<{
      id: string;
      productId: string | null;
      productName: string;
      categoryName: string;
      quantity: Prisma.Decimal | null;
      note: string;
      sortOrder: number;
    }>;
  }): CountSession {
    return {
      id: session.id,
      locationId: session.locationId,
      locationName: session.locationName,
      locationCode: session.locationCode,
      listId: session.listId,
      listTitle: session.listTitle,
      staffId: session.staffId,
      staffName: session.staffName,
      shift: asShift(session.shift),
      status: asStatus(session.status),
      countDate: session.countDate,
      submittedAt: session.submittedAt?.toISOString() || null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      lines: [...session.lines]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((line) => this.toLine(line))
    };
  }

  async listLocations(): Promise<CountLocationOption[]> {
    const locations = await this.prisma.location.findMany({
      where: { active: true },
      orderBy: [{ code: "asc" }, { name: "asc" }]
    });
    return locations.map((location) => ({ id: location.id, name: location.name, code: location.code }));
  }

  async listLists(activeOnly = true): Promise<CountList[]> {
    const lists = await this.prisma.countList.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { products: { orderBy: { sortOrder: "asc" }, select: { productId: true } } }
    });
    return lists.map((list) => this.toList(list));
  }

  private toList(list: {
    id: string;
    title: string;
    active: boolean;
    sortOrder: number;
    products: Array<{ productId: string }>;
  }): CountList {
    return {
      id: list.id,
      title: list.title,
      active: list.active,
      sortOrder: list.sortOrder,
      productIds: list.products.map((item) => item.productId),
      productCount: list.products.length
    };
  }

  async getList(id: string, activeOnly = true) {
    const list = await this.prisma.countList.findUnique({
      where: { id },
      include: { products: { orderBy: { sortOrder: "asc" }, select: { productId: true } } }
    });
    if (!list || (activeOnly && !list.active)) {
      throw new BadRequestException({ message: "Kies een tellinglijst." });
    }
    return list;
  }

  async catalog(activeOnly = true, listId?: string): Promise<CountCategory[]> {
    if (listId) {
      const items = await this.prisma.countListProduct.findMany({
        where: {
          listId,
          ...(activeOnly
            ? { product: { active: true, category: { active: true } } }
            : {})
        },
        orderBy: { sortOrder: "asc" },
        include: { product: { include: { category: true } } }
      });
      const groups = new Map<string, CountCategory>();
      for (const item of items) {
        const category = item.product.category;
        let group = groups.get(category.id);
        if (!group) {
          group = {
            id: category.id,
            name: category.name,
            active: category.active,
            sortOrder: category.sortOrder,
            products: []
          };
          groups.set(category.id, group);
        }
        group.products.push({
          id: item.product.id,
          categoryId: item.product.categoryId,
          name: item.product.name,
          active: item.product.active,
          sortOrder: item.sortOrder
        });
      }
      return [...groups.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    }

    const categories = await this.prisma.countCategory.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: activeOnly ? { active: true } : undefined,
          orderBy: { sortOrder: "asc" }
        }
      }
    });
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      active: category.active,
      sortOrder: category.sortOrder,
      products: category.products.map(
        (product): CountProduct => ({
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          active: product.active,
          sortOrder: product.sortOrder
        })
      )
    }));
  }

  async createList(input: CreateCountListInput) {
    const title = String(input.title || "").trim();
    if (!title) throw new BadRequestException({ message: "Lijsttitel is verplicht." });
    const max = await this.prisma.countList.aggregate({ _max: { sortOrder: true } });
    const list = await this.prisma.countList.create({
      data: {
        id: await this.uniqueId(slugify(title) || "lijst"),
        title,
        sortOrder: (max._max.sortOrder ?? -1) + 1
      }
    });
    if (input.productIds) await this.replaceListProducts(list.id, input.productIds);
    return this.getList(list.id, false).then((item) => this.toList(item));
  }

  async updateList(id: string, input: UpdateCountListInput) {
    const data: Prisma.CountListUpdateInput = {};
    if (input.title !== undefined) {
      const title = String(input.title).trim();
      if (!title) throw new BadRequestException({ message: "Lijsttitel is verplicht." });
      data.title = title;
    }
    if (input.active !== undefined) data.active = Boolean(input.active);
    if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder);
    if (Object.keys(data).length) {
      await this.prisma.countList.update({ where: { id }, data });
    }
    if (input.productIds) await this.replaceListProducts(id, input.productIds);
    return this.getList(id, false).then((item) => this.toList(item));
  }

  private async replaceListProducts(listId: string, productIds: string[]) {
    const unique = [...new Set(productIds.map((id) => String(id || "").trim()).filter(Boolean))];
    if (unique.length) {
      const found = await this.prisma.countProduct.findMany({ where: { id: { in: unique } }, select: { id: true } });
      if (found.length !== unique.length) {
        throw new BadRequestException({ message: "Een of meer producten bestaan niet." });
      }
    }
    await this.prisma.$transaction([
      this.prisma.countListProduct.deleteMany({ where: { listId } }),
      ...(unique.length
        ? [
            this.prisma.countListProduct.createMany({
              data: unique.map((productId, index) => ({ listId, productId, sortOrder: index }))
            })
          ]
        : [])
    ]);
  }

  async removeList(id: string) {
    const used = await this.prisma.countSession.count({ where: { listId: id } });
    if (used) {
      throw new BadRequestException({ message: "Deze lijst heeft al tellingen en kan niet verwijderd worden." });
    }
    await this.prisma.countList.delete({ where: { id } });
    return { message: "Lijst verwijderd." };
  }

  async moveList(id: string, direction: "up" | "down") {
    const items = await this.prisma.countList.findMany({ orderBy: { sortOrder: "asc" } });
    await this.swapSort(items, id, direction, (item) =>
      this.prisma.countList.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    );
    return this.listLists(false);
  }

  async staffUser(staffId: string): Promise<CountStaffSessionUser> {
    const staff = await this.prisma.countStaff.findUnique({
      where: { id: staffId },
      include: { location: true }
    });
    if (!staff || !staff.active) throw new NotFoundException({ message: "Gebruiker niet gevonden." });
    return {
      id: staff.id,
      name: staff.name,
      locationId: staff.locationId,
      locationName: staff.location?.name || null,
      locationCode: staff.location?.code || null
    };
  }

  async me(staffId: string) {
    const [staff, locations, lists] = await Promise.all([
      this.staffUser(staffId),
      this.listLocations(),
      this.listLists(true)
    ]);
    return { staff, locations, lists };
  }

  async getCurrentCount(
    staffId: string,
    locationId: string,
    shiftInput: string,
    listId: string,
    countDateInput?: string
  ) {
    await this.staffUser(staffId);
    if (!listId) throw new BadRequestException({ message: "Kies een tellinglijst." });
    const shift = asShift(shiftInput);
    const countDate = countDateInput && isDateString(countDateInput) ? countDateInput : todayInAmsterdam();
    const session = await this.prisma.countSession.findUnique({
      where: { locationId_countDate_shift_listId: { locationId, countDate, shift, listId } },
      include: { lines: true }
    });
    return session ? this.toSession(session) : null;
  }

  async saveDraft(staffId: string, input: SaveCountSessionInput): Promise<CountSession> {
    const staff = await this.prisma.countStaff.findUnique({
      where: { id: staffId },
      include: { location: true }
    });
    if (!staff || !staff.active) throw new NotFoundException({ message: "Gebruiker niet gevonden." });

    const shift = asShift(input.shift);
    const countDate = input.countDate && isDateString(input.countDate) ? input.countDate : todayInAmsterdam();
    const locationId = String(input.locationId || "").trim();
    const listId = String(input.listId || "").trim();
    const location = await this.prisma.location.findUnique({ where: { id: locationId } });
    if (!location) throw new BadRequestException({ message: "Kies een vestiging." });
    const list = await this.getList(listId, true);

    const existing = await this.prisma.countSession.findUnique({
      where: { locationId_countDate_shift_listId: { locationId, countDate, shift, listId } }
    });
    if (existing && existing.status === "submitted") {
      throw new BadRequestException({ message: "Deze telling is al verzonden." });
    }

    const catalog = await this.catalog(true, listId);
    const productMap = new Map(
      catalog.flatMap((category) =>
        category.products.map((product) => [product.id, { product, categoryName: category.name }] as const)
      )
    );

    const lines = (input.lines || [])
      .filter((line) => parseQuantity(line.quantity) !== null || String(line.note || "").trim())
      .map((line, index) => this.buildLineData(line, productMap, index));

    const data = {
      locationId,
      locationName: location.name,
      locationCode: location.code,
      listId: list.id,
      listTitle: list.title,
      staffId: staff.id,
      staffName: staff.name,
      shift,
      status: "draft",
      countDate
    };

    const session = existing
      ? await this.prisma.$transaction(async (tx) => {
          await tx.countLine.deleteMany({ where: { sessionId: existing.id } });
          return tx.countSession.update({
            where: { id: existing.id },
            data: { ...data, lines: { create: lines } },
            include: { lines: true }
          });
        })
      : await this.prisma.countSession.create({
          data: { ...data, lines: { create: lines } },
          include: { lines: true }
        });

    this.logger.log(`Telling opgeslagen ${session.id} (${location.name} ${shift} ${countDate})`);
    return this.toSession(session);
  }

  async submit(staffId: string, sessionId: string): Promise<CountSession> {
    const session = await this.prisma.countSession.findUnique({
      where: { id: sessionId },
      include: { lines: true }
    });
    if (!session) throw new NotFoundException({ message: "Telling niet gevonden." });
    if (session.staffId && session.staffId !== staffId) {
      throw new BadRequestException({ message: "Deze telling hoort bij een andere gebruiker." });
    }
    if (session.status === "submitted") return this.toSession(session);

    const updated = await this.prisma.countSession.update({
      where: { id: session.id },
      data: { status: "submitted", submittedAt: new Date() },
      include: { lines: true }
    });
    this.logger.log(`Telling verzonden ${updated.id}`);
    return this.toSession(updated);
  }

  private buildLineData(
    line: CountLineInput,
    productMap: Map<string, { product: CountProduct; categoryName: string }>,
    index: number
  ) {
    const productId = String(line.productId || "").trim();
    const found = productMap.get(productId);
    if (!found) throw new BadRequestException({ message: "Onbekend product in de telling." });
    const note = String(line.note || "").trim().slice(0, 500);
    return {
      productId: found.product.id,
      productName: found.product.name,
      categoryName: found.categoryName,
      quantity: parseQuantity(line.quantity),
      note,
      sortOrder: index
    };
  }

  async listStaff(): Promise<CountStaffRecord[]> {
    const staff = await this.prisma.countStaff.findMany({
      orderBy: { createdAt: "asc" },
      include: { location: true }
    });
    return staff.map((item) => this.toStaffRecord(item));
  }

  async createStaff(input: CreateCountStaffInput) {
    const name = String(input.name || "").trim();
    if (!name) throw new BadRequestException({ message: "Naam is verplicht." });
    const locationId = await this.optionalLocationId(input.locationId);
    let pin = this.auth.normalizePin(input.loginNumber);
    if (input.loginNumber && !pin) {
      throw new BadRequestException({ message: "Inlognummer moet 9 cijfers zijn." });
    }
    if (!pin) pin = await this.auth.uniquePin();
    else if (await this.prisma.countStaff.findUnique({ where: { loginLookup: this.auth.lookupFor(pin) } })) {
      throw new BadRequestException({ message: "Dit inlognummer is al in gebruik." });
    }

    const staff = await this.prisma.countStaff.create({
      data: {
        name,
        loginLookup: this.auth.lookupFor(pin),
        loginHash: this.auth.hashPin(pin),
        loginHint: this.auth.hintFor(pin),
        active: input.active !== false,
        locationId
      },
      include: { location: true }
    });
    this.logger.log(`Telling-gebruiker aangemaakt ${staff.id}`);
    return { staff: this.toStaffRecord(staff), loginNumber: pin };
  }

  async updateStaff(id: string, input: UpdateCountStaffInput) {
    const existing = await this.prisma.countStaff.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: "Gebruiker niet gevonden." });

    const data: Prisma.CountStaffUpdateInput = {};
    if (input.name !== undefined) {
      const name = String(input.name).trim();
      if (!name) throw new BadRequestException({ message: "Naam is verplicht." });
      data.name = name;
    }
    if (input.active !== undefined) {
      data.active = Boolean(input.active);
      this.logger.log(`Telling-gebruiker ${id} ${input.active ? "geactiveerd" : "geblokkeerd"}`);
    }
    if (input.locationId !== undefined) {
      const locationId = await this.optionalLocationId(input.locationId);
      data.location = locationId ? { connect: { id: locationId } } : { disconnect: true };
    }
    if (input.loginNumber) {
      const pin = this.auth.normalizePin(input.loginNumber);
      if (!pin) throw new BadRequestException({ message: "Inlognummer moet 9 cijfers zijn." });
      const taken = await this.prisma.countStaff.findUnique({ where: { loginLookup: this.auth.lookupFor(pin) } });
      if (taken && taken.id !== id) throw new BadRequestException({ message: "Dit inlognummer is al in gebruik." });
      data.loginLookup = this.auth.lookupFor(pin);
      data.loginHash = this.auth.hashPin(pin);
      data.loginHint = this.auth.hintFor(pin);
    }

    const staff = await this.prisma.countStaff.update({
      where: { id },
      data,
      include: { location: true }
    });
    return {
      staff: this.toStaffRecord(staff),
      loginNumber: input.loginNumber ? this.auth.normalizePin(input.loginNumber) : undefined
    };
  }

  async removeStaff(id: string) {
    await this.prisma.countStaff.delete({ where: { id } });
    this.logger.log(`Telling-gebruiker verwijderd ${id}`);
    return { message: "Gebruiker verwijderd." };
  }

  private async optionalLocationId(value: string | null | undefined) {
    if (value === undefined) return undefined;
    if (!value) return null;
    const location = await this.prisma.location.findUnique({ where: { id: value } });
    if (!location) throw new BadRequestException({ message: "Onbekende vestiging." });
    return location.id;
  }

  async createCategory(input: CreateCountCategoryInput) {
    const name = String(input.name || "").trim();
    if (!name) throw new BadRequestException({ message: "Categorienaam is verplicht." });
    const max = await this.prisma.countCategory.aggregate({ _max: { sortOrder: true } });
    const category = await this.prisma.countCategory.create({
      data: {
        id: await this.uniqueId(slugify(name) || "categorie"),
        name,
        sortOrder: (max._max.sortOrder ?? -1) + 1
      }
    });
    return category;
  }

  async updateCategory(id: string, input: UpdateCountCategoryInput) {
    const data: Prisma.CountCategoryUpdateInput = {};
    if (input.name !== undefined) {
      const name = String(input.name).trim();
      if (!name) throw new BadRequestException({ message: "Categorienaam is verplicht." });
      data.name = name;
    }
    if (input.active !== undefined) data.active = Boolean(input.active);
    if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder);
    return this.prisma.countCategory.update({ where: { id }, data });
  }

  async removeCategory(id: string) {
    await this.prisma.countCategory.delete({ where: { id } });
    return { message: "Categorie verwijderd." };
  }

  async createProduct(input: CreateCountProductInput) {
    const name = String(input.name || "").trim();
    const categoryId = String(input.categoryId || "").trim();
    if (!name) throw new BadRequestException({ message: "Productnaam is verplicht." });
    const category = await this.prisma.countCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException({ message: "Kies een categorie." });
    const max = await this.prisma.countProduct.aggregate({
      where: { categoryId },
      _max: { sortOrder: true }
    });
    return this.prisma.countProduct.create({
      data: {
        id: await this.uniqueId(slugify(name) || "product"),
        name,
        categoryId,
        sortOrder: (max._max.sortOrder ?? -1) + 1
      }
    });
  }

  async updateProduct(id: string, input: UpdateCountProductInput) {
    const existing = await this.prisma.countProduct.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: "Product niet gevonden." });
    const data: Prisma.CountProductUpdateInput = {};
    if (input.name !== undefined) {
      const name = String(input.name).trim();
      if (!name) throw new BadRequestException({ message: "Productnaam is verplicht." });
      data.name = name;
    }
    if (input.active !== undefined) data.active = Boolean(input.active);
    if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder);
    if (input.categoryId !== undefined) {
      const category = await this.prisma.countCategory.findUnique({ where: { id: input.categoryId } });
      if (!category) throw new BadRequestException({ message: "Onbekende categorie." });
      data.category = { connect: { id: category.id } };
    }
    return this.prisma.countProduct.update({ where: { id }, data });
  }

  async removeProduct(id: string) {
    await this.prisma.countProduct.delete({ where: { id } });
    return { message: "Product verwijderd." };
  }

  async moveCategory(id: string, direction: "up" | "down") {
    const items = await this.prisma.countCategory.findMany({ orderBy: { sortOrder: "asc" } });
    await this.swapSort(items, id, direction, (item) =>
      this.prisma.countCategory.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    );
    return this.catalog(false);
  }

  async moveProduct(id: string, direction: "up" | "down") {
    const product = await this.prisma.countProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException({ message: "Product niet gevonden." });
    const items = await this.prisma.countProduct.findMany({
      where: { categoryId: product.categoryId },
      orderBy: { sortOrder: "asc" }
    });
    await this.swapSort(items, id, direction, (item) =>
      this.prisma.countProduct.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    );
    return this.catalog(false);
  }

  private async swapSort<T extends { id: string; sortOrder: number }>(
    items: T[],
    id: string,
    direction: "up" | "down",
    save: (item: T) => Promise<unknown>
  ) {
    const index = items.findIndex((item) => item.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= items.length) return;
    const current = items[index];
    const other = items[swapWith];
    const currentOrder = current.sortOrder;
    current.sortOrder = other.sortOrder;
    other.sortOrder = currentOrder;
    await save(other);
    await save(current);
  }

  private async uniqueId(base: string) {
    let candidate = base;
    let n = 1;
    while (
      (await this.prisma.countProduct.findUnique({ where: { id: candidate } })) ||
      (await this.prisma.countCategory.findUnique({ where: { id: candidate } })) ||
      (await this.prisma.countList.findUnique({ where: { id: candidate } }))
    ) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    return candidate;
  }

  private sessionWhere(filters: CountListFilters): Prisma.CountSessionWhereInput {
    const where: Prisma.CountSessionWhereInput = {};
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.staffId) where.staffId = filters.staffId;
    if (filters.listId) where.listId = filters.listId;
    if (filters.shift && COUNT_SHIFTS.includes(filters.shift)) where.shift = filters.shift;
    if (filters.status && COUNT_STATUSES.includes(filters.status)) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.countDate = {};
      if (filters.dateFrom && isDateString(filters.dateFrom)) where.countDate.gte = filters.dateFrom;
      if (filters.dateTo && isDateString(filters.dateTo)) where.countDate.lte = filters.dateTo;
    }
    const lineFilter: Prisma.CountLineWhereInput = {};
    if (filters.productId) lineFilter.productId = filters.productId;
    if (filters.productName && !filters.productId) lineFilter.productName = filters.productName;
    if (filters.categoryName) lineFilter.categoryName = filters.categoryName;
    if (Object.keys(lineFilter).length) where.lines = { some: lineFilter };
    return where;
  }

  async listSessions(filters: CountListFilters): Promise<CountSessionSummary[]> {
    const extra = Boolean(filters.weekday || filters.productId || filters.productName || filters.categoryName);
    const sessions = await this.prisma.countSession.findMany({
      where: this.sessionWhere(filters),
      orderBy: [{ countDate: "desc" }, { updatedAt: "desc" }],
      take: extra ? 1500 : 400,
      include: { lines: true }
    });
    const weekday = String(filters.weekday || "")
      .trim()
      .toLowerCase();
    const matched = weekday ? sessions.filter((session) => weekdayName(session.countDate) === weekday) : sessions;

    return matched.map((session) => ({
      id: session.id,
      locationId: session.locationId,
      locationName: session.locationName,
      locationCode: session.locationCode,
      listId: session.listId,
      listTitle: session.listTitle,
      staffId: session.staffId,
      staffName: session.staffName,
      shift: asShift(session.shift),
      status: asStatus(session.status),
      countDate: session.countDate,
      submittedAt: session.submittedAt?.toISOString() || null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      lineCount: session.lines.length,
      noteCount: session.lines.filter((line) => line.note.trim()).length
    }));
  }

  async listProductStats(filters: CountListFilters): Promise<{
    products: CountProductStat[];
    categories: CountCategoryStat[];
    weekdays: Array<{ weekday: string; quantity: number }>;
    locations: Array<{ locationId: string; locationName: string; locationCode: string; quantity: number }>;
    lists: Array<{ listId: string; listTitle: string; quantity: number }>;
    totalQuantity: number;
    sessionCount: number;
  }> {
    const weekdayFilter = String(filters.weekday || "")
      .trim()
      .toLowerCase();
    const sessions = await this.prisma.countSession.findMany({
      where: this.sessionWhere({ ...filters, productId: undefined, categoryName: undefined }),
      orderBy: [{ countDate: "desc" }, { updatedAt: "desc" }],
      take: 1500,
      include: { lines: true }
    });
    const matched = weekdayFilter ? sessions.filter((session) => weekdayName(session.countDate) === weekdayFilter) : sessions;
    const products = new Map<string, CountProductStat & { sessions: Set<string> }>();
    const categories = new Map<string, CountCategoryStat & { sessions: Set<string> }>();
    const weekdays = new Map<string, number>();
    const locationTotals = new Map<string, { locationId: string; locationName: string; locationCode: string; quantity: number }>();
    const listTotals = new Map<string, { listId: string; listTitle: string; quantity: number }>();

    for (const session of matched) {
      const day = weekdayName(session.countDate);
      for (const line of session.lines) {
        const quantity = decimalToNumber(line.quantity) || 0;
        if (!quantity && !line.note.trim()) continue;
        const productKey = `${line.productId || ""}::${line.productName}::${line.categoryName}`;
        const product = products.get(productKey) || {
          productId: line.productId,
          productName: line.productName,
          categoryName: line.categoryName,
          quantity: 0,
          sessionCount: 0,
          sessions: new Set<string>()
        };
        product.quantity += quantity;
        product.sessions.add(session.id);
        product.sessionCount = product.sessions.size;
        products.set(productKey, product);

        const category = categories.get(line.categoryName) || {
          categoryName: line.categoryName,
          quantity: 0,
          sessionCount: 0,
          sessions: new Set<string>()
        };
        category.quantity += quantity;
        category.sessions.add(session.id);
        category.sessionCount = category.sessions.size;
        categories.set(line.categoryName, category);

        weekdays.set(day, (weekdays.get(day) || 0) + quantity);

        const location = locationTotals.get(session.locationId) || {
          locationId: session.locationId,
          locationName: session.locationName,
          locationCode: session.locationCode,
          quantity: 0
        };
        location.quantity += quantity;
        locationTotals.set(session.locationId, location);

        const list = listTotals.get(session.listId) || {
          listId: session.listId,
          listTitle: session.listTitle,
          quantity: 0
        };
        list.quantity += quantity;
        listTotals.set(session.listId, list);
      }
    }

    const productStats = [...products.values()]
      .map(({ sessions: _sessions, ...item }) => item)
      .sort((a, b) => b.quantity - a.quantity);
    const categoryStats = [...categories.values()]
      .map(({ sessions: _sessions, ...item }) => item)
      .sort((a, b) => b.quantity - a.quantity);

    return {
      products: productStats,
      categories: categoryStats,
      weekdays: [...weekdays.entries()].map(([weekday, quantity]) => ({ weekday, quantity })),
      locations: [...locationTotals.values()].sort((a, b) => b.quantity - a.quantity),
      lists: [...listTotals.values()].sort((a, b) => b.quantity - a.quantity),
      totalQuantity: productStats.reduce((sum, item) => sum + item.quantity, 0),
      sessionCount: matched.length
    };
  }

  async getSession(id: string): Promise<CountSession> {
    const session = await this.prisma.countSession.findUnique({
      where: { id },
      include: { lines: true }
    });
    if (!session) throw new NotFoundException({ message: "Telling niet gevonden." });
    return this.toSession(session);
  }

  async exportSessions(filters: CountListFilters, format: "csv" | "xlsx") {
    const summaries = await this.listSessions(filters);
    const sessions = await Promise.all(summaries.map((item) => this.getSession(item.id)));
    const rows = [
      ["Datum", "Tijd", "Lijst", "Soort", "Status", "Winkelnummer", "Winkel", "Gebruiker", "Categorie", "Product", "Aantal", "Opmerking"]
    ];
    for (const session of sessions) {
      const time = new Date(session.submittedAt || session.updatedAt).toLocaleTimeString("nl-NL", {
        timeZone: "Europe/Amsterdam",
        hour: "2-digit",
        minute: "2-digit"
      });
      const shift = session.shift === "morning" ? "Ochtendtelling" : "Avondtelling";
      const status = session.status === "submitted" ? "Verzonden" : "Concept";
      if (!session.lines.length) {
        rows.push([
          session.countDate,
          time,
          session.listTitle,
          shift,
          status,
          session.locationCode,
          session.locationName,
          session.staffName,
          "",
          "",
          "",
          ""
        ]);
        continue;
      }
      for (const line of session.lines) {
        rows.push([
          session.countDate,
          time,
          session.listTitle,
          shift,
          status,
          session.locationCode,
          session.locationName,
          session.staffName,
          line.categoryName,
          line.productName,
          line.quantity === null ? "" : String(line.quantity).replace(".", ","),
          line.note
        ]);
      }
    }

    this.logger.log(`Tellingen export ${format} (${sessions.length} tellingen)`);
    if (format === "xlsx") {
      return { filename: "tellingen.xls", contentType: "application/vnd.ms-excel", body: this.toSpreadsheetXml(rows) };
    }
    return { filename: "tellingen.csv", contentType: "text/csv; charset=utf-8", body: this.toCsv(rows) };
  }

  private toCsv(rows: string[][]) {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    return `\uFEFF${csv}`;
  }

  private toSpreadsheetXml(rows: string[][]) {
    const escape = (value: string) =>
      String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const body = rows
      .map(
        (row) =>
          `<Row>${row
            .map((cell) => `<Cell><Data ss:Type="String">${escape(cell)}</Data></Cell>`)
            .join("")}</Row>`
      )
      .join("");
    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Tellingen"><Table>${body}</Table></Worksheet>
</Workbook>`;
  }
}
