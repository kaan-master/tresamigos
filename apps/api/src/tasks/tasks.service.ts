import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_TASK_GROUPS,
  GROUP_PALETTE,
  boardColumns,
  isoDate,
  isStoredTaskStatus,
  paletteColor,
  type BoardColumn
} from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const FILE_MAX = 2 * 1024 * 1024;
const FILE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel"
]);
const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

const personSelect = { id: true, name: true } as const;

const taskInclude = {
  customer: { select: { id: true, companyName: true, city: true } },
  assignee: { select: personSelect },
  assignees: {
    orderBy: { sortOrder: "asc" as const },
    select: { user: { select: personSelect } }
  },
  _count: { select: { comments: true, files: true } }
} as const;

type TaskRow = Prisma.TodoTaskGetPayload<{ include: typeof taskInclude }>;

export type TodoActor = { id: string | null; name: string };

function text(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new BadRequestException(`${label} ontbreekt.`);
  const next = value.trim();
  if (!next || next.length > max) throw new BadRequestException(`${label} is ongeldig.`);
  return next;
}

function optionalText(value: unknown, max: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new BadRequestException("Tekst is ongeldig.");
  return value.slice(0, max);
}

function nullableId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !UUID.test(value)) throw new BadRequestException("Ongeldige verwijzing.");
  return value;
}

function dayField(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !DAY.test(value)) throw new BadRequestException("Kies een geldige datum.");
  return value;
}

function asDate(day: string | null | undefined): Date | null | undefined {
  if (day === undefined) return undefined;
  if (day === null) return null;
  return new Date(`${day}T00:00:00.000Z`);
}

function fieldMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const fields: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") fields[key] = item;
    else if (typeof item === "number" && Number.isFinite(item)) fields[key] = String(item);
  }
  return fields;
}

function taskJson(task: TaskRow) {
  const seated = task.assignees.map((row) => row.user);
  const assignees = seated.length > 0 ? seated : task.assignee ? [task.assignee] : [];
  return {
    id: task.id,
    boardId: task.boardId,
    categoryId: task.categoryId,
    title: task.title,
    notes: task.notes,
    status: task.status,
    customer: task.customer ? { id: task.customer.id, companyName: task.customer.companyName, city: task.customer.city } : null,
    assignee: assignees[0] ?? null,
    assignees,
    startDate: isoDate(task.startDate),
    dueDate: isoDate(task.dueDate),
    includeInAgenda: task.includeInAgenda,
    fields: fieldMap(task.fields),
    updates: task._count.comments + task._count.files,
    sortOrder: task.sortOrder
  };
}

function boardJson(board: { id: string; name: string; grouped: boolean; starred: boolean; sortOrder: number; columns: unknown }) {
  return {
    id: board.id,
    name: board.name,
    grouped: board.grouped,
    starred: Boolean(board.starred),
    columns: boardColumns(board.columns) satisfies BoardColumn[],
    sortOrder: board.sortOrder
  };
}

function categoryJson(category: { id: string; boardId: string | null; name: string; color: string; sortOrder: number }) {
  return {
    id: category.id,
    boardId: category.boardId,
    name: category.name,
    color: category.color,
    sortOrder: category.sortOrder
  };
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[/\\]/g, " ").replace(/[^\w.\- ()]/g, "").trim().slice(0, 120);
  return cleaned || "bijlage";
}

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "";
}

function authorJson(authorId: string | null, authorName: string) {
  return { id: authorId ?? "master", name: authorName };
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    await this.ensureWorkspace();
    const [boards, categories, tasks, colleagues, customers] = await Promise.all([
      this.prisma.todoBoard.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.todoCategory.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.todoTask.findMany({
        where: { status: { not: "ARCHIVED" } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: taskInclude
      }),
      this.prisma.adminUser.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: personSelect
      }),
      this.prisma.todoCustomer.findMany({ orderBy: { companyName: "asc" } })
    ]);
    return {
      boards: boards.map(boardJson),
      categories: categories.filter((category) => category.boardId).map(categoryJson),
      tasks: tasks.map(taskJson),
      colleagues,
      customers: customers.map((customer) => ({
        id: customer.id,
        companyName: customer.companyName,
        city: customer.city
      }))
    };
  }

  async listCustomers() {
    const customers = await this.prisma.todoCustomer.findMany({ orderBy: { companyName: "asc" } });
    return customers.map((customer) => ({ id: customer.id, companyName: customer.companyName, city: customer.city }));
  }

  async createCustomer(body: { companyName?: unknown; city?: unknown }) {
    const companyName = text(body.companyName, 80, "Klantnaam");
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "";
    const existing = await this.prisma.todoCustomer.findFirst({
      where: { companyName: { equals: companyName, mode: "insensitive" } }
    });
    const saved = existing ?? (await this.prisma.todoCustomer.create({ data: { companyName, city } }));
    return { id: saved.id, companyName: saved.companyName, city: saved.city };
  }

  async createBoard(body: { name?: unknown }) {
    const name = text(body.name, 80, "Boardnaam");
    const last = await this.prisma.todoBoard.aggregate({ _max: { sortOrder: true } });
    const created = await this.prisma.todoBoard.create({
      data: { name, sortOrder: (last._max.sortOrder ?? 0) + 1 }
    });
    await this.ensureBoardCategories();
    const categories = await this.prisma.todoCategory.findMany({
      where: { boardId: created.id },
      orderBy: { sortOrder: "asc" }
    });
    return { ...boardJson(created), categories: categories.map(categoryJson) };
  }

  async reorderBoards(body: { orderedIds?: unknown }) {
    const orderedIds = this.idList(body.orderedIds);
    const boards = await this.prisma.todoBoard.findMany({ select: { id: true } });
    this.assertSameIds(boards.map((board) => board.id), orderedIds, "De volgorde hoort bij alle boards.");
    await this.prisma.$transaction(
      orderedIds.map((id, sortOrder) => this.prisma.todoBoard.update({ where: { id }, data: { sortOrder } }))
    );
    return { ok: true };
  }

  async patchBoard(id: string, body: { name?: unknown; grouped?: unknown; starred?: unknown; columns?: unknown }) {
    const existing = await this.prisma.todoBoard.findUnique({ where: { id: this.uuid(id) } });
    if (!existing) throw new NotFoundException("Board niet gevonden.");
    const name = body.name === undefined ? undefined : text(body.name, 80, "Boardnaam");
    const grouped = body.grouped === undefined ? undefined : this.bool(body.grouped);
    const starred = body.starred === undefined ? undefined : this.bool(body.starred);
    const columns = body.columns === undefined ? undefined : (boardColumns(body.columns) as unknown as Prisma.InputJsonValue);
    const saved = await this.prisma.$transaction(async (tx) => {
      if (starred === true) {
        await tx.todoBoard.updateMany({ where: { id: { not: existing.id } }, data: { starred: false } });
      }
      return tx.todoBoard.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(grouped !== undefined ? { grouped } : {}),
          ...(starred !== undefined ? { starred } : {}),
          ...(columns !== undefined ? { columns } : {})
        }
      });
    });
    return boardJson(saved);
  }

  async deleteBoard(id: string) {
    const existing = await this.prisma.todoBoard.findUnique({ where: { id: this.uuid(id) } });
    if (!existing) throw new NotFoundException("Board niet gevonden.");
    const count = await this.prisma.todoBoard.count();
    if (count <= 1) throw new BadRequestException("Het laatste board blijft staan.");
    await this.prisma.todoBoard.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async createCategory(body: { name?: unknown; color?: unknown; boardId?: unknown }) {
    const name = text(body.name, 80, "Categorienaam");
    const boardId = nullableId(body.boardId);
    if (!boardId) throw new BadRequestException("Kies een board voor de categorie.");
    const board = await this.prisma.todoBoard.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!board) throw new NotFoundException("Board niet gevonden.");
    const taken = await this.prisma.todoCategory.count({ where: { boardId: board.id } });
    const requested = typeof body.color === "string" ? body.color : "";
    const color = paletteColor(requested) ?? GROUP_PALETTE[taken % GROUP_PALETTE.length];
    const last = await this.prisma.todoCategory.aggregate({ where: { boardId: board.id }, _max: { sortOrder: true } });
    const created = await this.prisma.todoCategory.create({
      data: { boardId: board.id, name, color, sortOrder: (last._max.sortOrder ?? 0) + 1 }
    });
    return categoryJson(created);
  }

  async reorderCategories(body: { boardId?: unknown; orderedIds?: unknown }) {
    const boardId = nullableId(body.boardId);
    if (!boardId) throw new BadRequestException("Kies een board voor de categorie.");
    const board = await this.prisma.todoBoard.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!board) throw new NotFoundException("Board niet gevonden.");
    const orderedIds = this.idList(body.orderedIds);
    const categories = await this.prisma.todoCategory.findMany({ where: { boardId: board.id }, select: { id: true } });
    this.assertSameIds(
      categories.map((category) => category.id),
      orderedIds,
      "De volgorde hoort bij alle categorieën van dit board."
    );
    await this.prisma.$transaction(
      orderedIds.map((id, sortOrder) => this.prisma.todoCategory.update({ where: { id }, data: { sortOrder } }))
    );
    return { ok: true };
  }

  async patchCategory(id: string, body: { name?: unknown; color?: unknown }) {
    const existing = await this.prisma.todoCategory.findUnique({ where: { id: this.uuid(id) } });
    if (!existing) throw new NotFoundException("Categorie niet gevonden.");
    const name = body.name === undefined ? undefined : text(body.name, 80, "Categorienaam");
    let color: string | undefined;
    if (body.color !== undefined) {
      if (typeof body.color !== "string") throw new BadRequestException("Kies een kleur uit het palet.");
      const picked = paletteColor(body.color);
      if (!picked) throw new BadRequestException("Kies een kleur uit het palet.");
      color = picked;
    }
    const saved = await this.prisma.todoCategory.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {})
      }
    });
    return categoryJson(saved);
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.todoCategory.findUnique({ where: { id: this.uuid(id) } });
    if (!existing) throw new NotFoundException("Categorie niet gevonden.");
    await this.prisma.todoCategory.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async createTask(body: { boardId?: unknown; categoryId?: unknown; title?: unknown }) {
    const title = text(body.title, 200, "Taaknaam");
    const boardId = nullableId(body.boardId);
    if (!boardId) throw new BadRequestException("Kies een board.");
    const board = await this.prisma.todoBoard.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!board) throw new NotFoundException("Board niet gevonden.");
    const categoryId = await this.categoryId(body.categoryId);
    const last = await this.prisma.todoTask.aggregate({ where: { boardId: board.id }, _max: { sortOrder: true } });
    const created = await this.prisma.todoTask.create({
      data: {
        boardId: board.id,
        ...(categoryId ? { categoryId } : {}),
        title,
        sortOrder: (last._max.sortOrder ?? 0) + 1
      },
      include: taskInclude
    });
    return taskJson(created);
  }

  async reorderTasks(body: { boardId?: unknown; items?: unknown }) {
    const boardId = nullableId(body.boardId);
    if (!boardId) throw new BadRequestException("Kies een board.");
    const board = await this.prisma.todoBoard.findUnique({ where: { id: boardId }, select: { id: true } });
    if (!board) throw new NotFoundException("Board niet gevonden.");
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException("De volgorde hoort bij alle openstaande taken van dit board.");
    }
    const items = body.items.map((item) => {
      if (!item || typeof item !== "object") throw new BadRequestException("Ongeldige volgorde.");
      const row = item as { id?: unknown; categoryId?: unknown };
      const id = nullableId(row.id);
      if (!id) throw new BadRequestException("Ongeldige volgorde.");
      return { id, categoryId: row.categoryId };
    });
    const open = await this.prisma.todoTask.findMany({
      where: { boardId: board.id, status: { notIn: ["DONE", "ARCHIVED"] } },
      select: { id: true }
    });
    this.assertSameIds(
      open.map((task) => task.id),
      items.map((item) => item.id),
      "De volgorde hoort bij alle openstaande taken van dit board."
    );
    const resolved = [];
    for (const item of items) {
      resolved.push({ id: item.id, categoryId: await this.categoryId(item.categoryId) });
    }
    await this.prisma.$transaction(
      resolved.map((item, sortOrder) =>
        this.prisma.todoTask.update({
          where: { id: item.id },
          data: { sortOrder, categoryId: item.categoryId }
        })
      )
    );
    return { ok: true };
  }

  async patchTask(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.todoTask.findUnique({ where: { id: this.uuid(id) } });
    if (!existing) throw new NotFoundException("Taak niet gevonden.");
    const title = body.title === undefined ? undefined : text(body.title, 200, "Taaknaam");
    const notes = optionalText(body.notes, 4000);
    let status: string | undefined;
    if (body.status !== undefined) {
      if (typeof body.status !== "string" || !isStoredTaskStatus(body.status)) {
        throw new BadRequestException("Onbekende status.");
      }
      status = body.status;
    }
    const customerId = await this.customerId(body.customerId);
    const assigneeIds = await this.assigneeIds(body);
    const categoryId = body.categoryId === undefined ? undefined : await this.categoryId(body.categoryId);
    let boardId: string | undefined;
    if (body.boardId !== undefined) {
      const nextBoardId = nullableId(body.boardId);
      if (!nextBoardId) throw new BadRequestException("Kies een board.");
      const board = await this.prisma.todoBoard.findUnique({ where: { id: nextBoardId }, select: { id: true } });
      if (!board) throw new NotFoundException("Board niet gevonden.");
      boardId = nextBoardId;
    }
    const startDate = body.startDate !== undefined ? dayField(body.startDate) : isoDate(existing.startDate);
    const dueDate = body.dueDate !== undefined ? dayField(body.dueDate) : isoDate(existing.dueDate);
    if (startDate && dueDate && startDate > dueDate) {
      throw new BadRequestException("De startdatum moet op of voor de einddatum liggen.");
    }
    const includeInAgenda = body.includeInAgenda === undefined ? existing.includeInAgenda : this.bool(body.includeInAgenda);
    if (includeInAgenda && !startDate && !dueDate) {
      throw new BadRequestException("Kies een datum om de taak in de planning te zetten.");
    }
    let fields: Prisma.InputJsonValue | undefined;
    if (body.fields !== undefined) {
      if (!body.fields || typeof body.fields !== "object" || Array.isArray(body.fields)) {
        throw new BadRequestException("Extra velden zijn ongeldig.");
      }
      const next: Record<string, string> = { ...fieldMap(existing.fields) };
      for (const [key, value] of Object.entries(body.fields as Record<string, unknown>)) {
        if (key.length > 40 || typeof value !== "string" || value.length > 500) {
          throw new BadRequestException("Extra velden zijn ongeldig.");
        }
        next[key] = value;
      }
      fields = next;
    }
    const saved = await this.prisma.$transaction(async (tx) => {
      if (assigneeIds) {
        await tx.todoAssignee.deleteMany({ where: { taskId: existing.id } });
        if (assigneeIds.length > 0) {
          await tx.todoAssignee.createMany({
            data: assigneeIds.map((userId, sortOrder) => ({ taskId: existing.id, userId, sortOrder }))
          });
        }
      }
      const data: Prisma.TodoTaskUncheckedUpdateInput = {
        ...(title !== undefined ? { title } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(customerId !== undefined ? { customerId } : {}),
        ...(assigneeIds ? { assigneeId: assigneeIds[0] ?? null } : {}),
        ...(body.startDate !== undefined ? { startDate: asDate(dayField(body.startDate)) } : {}),
        ...(body.dueDate !== undefined ? { dueDate: asDate(dayField(body.dueDate)) } : {}),
        ...(body.includeInAgenda !== undefined ? { includeInAgenda } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(boardId !== undefined ? { boardId } : {}),
        ...(fields !== undefined ? { fields } : {})
      };
      return tx.todoTask.update({
        where: { id: existing.id },
        data,
        include: taskInclude
      });
    });
    return taskJson(saved);
  }

  async activity(id: string) {
    await this.requireTask(id);
    const [comments, files] = await Promise.all([
      this.prisma.todoComment.findMany({ where: { taskId: id }, orderBy: { createdAt: "asc" } }),
      this.prisma.todoFile.findMany({
        where: { taskId: id },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, mime: true, size: true, createdAt: true, authorId: true, authorName: true }
      })
    ]);
    return {
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: authorJson(comment.authorId, comment.authorName)
      })),
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        mime: file.mime,
        size: file.size,
        createdAt: file.createdAt.toISOString(),
        author: authorJson(file.authorId, file.authorName)
      }))
    };
  }

  async addComment(id: string, body: { body?: unknown }, actor: TodoActor) {
    const task = await this.requireTask(id);
    const message = text(body.body, 2000, "Reactie");
    const created = await this.prisma.todoComment.create({
      data: { taskId: task.id, authorId: actor.id, authorName: actor.name, body: message }
    });
    return {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      author: authorJson(created.authorId, created.authorName)
    };
  }

  async deleteComment(taskId: string, commentId: string) {
    await this.requireTask(taskId);
    const existing = await this.prisma.todoComment.findFirst({ where: { id: this.uuid(commentId), taskId } });
    if (!existing) throw new NotFoundException("Reactie niet gevonden.");
    await this.prisma.todoComment.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async addFile(taskId: string, body: { name?: unknown; mime?: unknown; data?: unknown }, actor: TodoActor) {
    const name = text(body.name, 180, "Bestandsnaam");
    const declared = typeof body.mime === "string" ? body.mime.trim().slice(0, 120) : "";
    const mime = FILE_TYPES.has(declared) ? declared : mimeFromName(name);
    if (!FILE_TYPES.has(mime)) {
      throw new BadRequestException("Dit bestandstype kan niet als bijlage. Gebruik een foto, pdf, tekst of Office-bestand.");
    }
    if (typeof body.data !== "string" || !body.data) throw new BadRequestException("De bijlage ontbreekt.");
    const bytes = Buffer.from(body.data, "base64");
    if (!bytes.length || bytes.length > FILE_MAX) throw new BadRequestException("Een bijlage mag hoogstens 2 MB zijn.");
    const task = await this.requireTask(taskId);
    const created = await this.prisma.todoFile.create({
      data: {
        taskId: task.id,
        authorId: actor.id,
        authorName: actor.name,
        name: safeFileName(name),
        mime,
        size: bytes.length,
        data: bytes
      }
    });
    return {
      id: created.id,
      name: created.name,
      mime: created.mime,
      size: created.size,
      createdAt: created.createdAt.toISOString(),
      author: authorJson(created.authorId, created.authorName)
    };
  }

  async readFile(taskId: string, fileId: string) {
    const file = await this.prisma.todoFile.findFirst({ where: { id: this.uuid(fileId), taskId: this.uuid(taskId) } });
    if (!file) throw new NotFoundException("Bijlage niet gevonden.");
    return file;
  }

  async deleteFile(taskId: string, fileId: string) {
    const existing = await this.readFile(taskId, fileId);
    await this.prisma.todoFile.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  async deleteTask(id: string) {
    const existing = await this.requireTask(id);
    await this.prisma.todoTask.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  private async ensureWorkspace() {
    const [templateCount, anyCategories, boardCount] = await Promise.all([
      this.prisma.todoCategory.count({ where: { boardId: null } }),
      this.prisma.todoCategory.count(),
      this.prisma.todoBoard.count()
    ]);
    if (templateCount === 0 && anyCategories === 0) {
      await this.prisma.todoCategory.createMany({
        data: DEFAULT_TASK_GROUPS.map((category, index) => ({
          name: category.name,
          color: category.color,
          sortOrder: index
        }))
      });
    }
    if (boardCount === 0) {
      await this.prisma.todoBoard.create({ data: { name: "To do", sortOrder: 0 } });
    }
    await this.ensureBoardCategories();
  }

  private async ensureBoardCategories() {
    const templates = await this.prisma.todoCategory.findMany({
      where: { boardId: null },
      orderBy: { sortOrder: "asc" }
    });
    const source =
      templates.length > 0
        ? templates
        : DEFAULT_TASK_GROUPS.map((category, index) => ({
            id: "",
            name: category.name,
            color: category.color,
            sortOrder: index
          }));
    const boards = await this.prisma.todoBoard.findMany({ select: { id: true } });
    for (const board of boards) {
      const existing = await this.prisma.todoCategory.count({ where: { boardId: board.id } });
      if (existing > 0) continue;
      for (const template of source) {
        const created = await this.prisma.todoCategory.create({
          data: {
            boardId: board.id,
            name: template.name,
            color: template.color,
            sortOrder: template.sortOrder
          }
        });
        if (template.id) {
          await this.prisma.todoTask.updateMany({
            where: { boardId: board.id, categoryId: template.id },
            data: { categoryId: created.id }
          });
        }
      }
    }
  }

  private async requireTask(id: string) {
    const task = await this.prisma.todoTask.findUnique({ where: { id: this.uuid(id) }, select: { id: true } });
    if (!task) throw new NotFoundException("Taak niet gevonden.");
    return task;
  }

  private async categoryId(value: unknown): Promise<string | null> {
    const id = nullableId(value);
    if (id === undefined || id === null) return null;
    const category = await this.prisma.todoCategory.findUnique({ where: { id }, select: { id: true } });
    if (!category) throw new BadRequestException("Categorie niet gevonden.");
    return category.id;
  }

  private async customerId(value: unknown): Promise<string | null | undefined> {
    if (value === undefined) return undefined;
    const id = nullableId(value);
    if (!id) return null;
    const customer = await this.prisma.todoCustomer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) throw new BadRequestException("Klant niet gevonden.");
    return customer.id;
  }

  private async assigneeIds(body: Record<string, unknown>): Promise<string[] | undefined> {
    if (body.assigneeIds === undefined && body.assigneeId === undefined) return undefined;
    const raw = body.assigneeIds !== undefined ? body.assigneeIds : body.assigneeId ? [body.assigneeId] : [];
    if (!Array.isArray(raw)) throw new BadRequestException("Collega niet gevonden.");
    if (raw.length > 12) throw new BadRequestException("Te veel collega’s.");
    const unique = [...new Set(raw.map((item) => nullableId(item)).filter((item): item is string => Boolean(item)))];
    if (unique.length === 0) return [];
    const users = await this.prisma.adminUser.findMany({
      where: { id: { in: unique }, active: true },
      select: { id: true }
    });
    if (users.length !== unique.length) throw new BadRequestException("Collega niet gevonden.");
    return unique;
  }

  private uuid(value: string) {
    if (!UUID.test(value)) throw new BadRequestException("Ongeldige verwijzing.");
    return value;
  }

  private idList(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) throw new BadRequestException("Ongeldige volgorde.");
    return value.map((item) => {
      if (typeof item !== "string" || !UUID.test(item)) throw new BadRequestException("Ongeldige volgorde.");
      return item;
    });
  }

  private bool(value: unknown) {
    if (typeof value !== "boolean") throw new BadRequestException("Ongeldige keuze.");
    return value;
  }

  private assertSameIds(have: string[], sent: string[], message: string) {
    const left = new Set(have);
    const right = new Set(sent);
    if (left.size !== right.size || [...left].some((id) => !right.has(id))) {
      throw new BadRequestException(message);
    }
  }
}
