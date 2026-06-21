import { Injectable } from "@nestjs/common";
import { ADMIN_TAB_IDS, type AdminTabId, type AdminUserRecord, type CreateAdminUserInput, type UpdateAdminUserInput } from "@tresamigos/types";
import { hashPassword } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";

function sanitizePermissions(input: string[] | undefined): AdminTabId[] {
  const allowed = new Set<string>(ADMIN_TAB_IDS);
  return (input || []).filter((item): item is AdminTabId => allowed.has(item));
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toRecord(user: {
    id: string;
    email: string;
    name: string;
    permissions: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AdminUserRecord {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      permissions: sanitizePermissions(user.permissions),
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  async list(): Promise<AdminUserRecord[]> {
    const users = await this.prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
    return users.map((user) => this.toRecord(user));
  }

  async create(input: CreateAdminUserInput): Promise<AdminUserRecord> {
    const email = String(input.email || "")
      .trim()
      .toLowerCase();
    const name = String(input.name || "").trim();
    const password = String(input.password || "");
    if (!email || !name || password.length < 8) {
      throw new Error("E-mail, naam en wachtwoord (min. 8 tekens) zijn verplicht.");
    }

    const user = await this.prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        permissions: sanitizePermissions(input.permissions)
      }
    });
    return this.toRecord(user);
  }

  async update(id: string, input: UpdateAdminUserInput): Promise<AdminUserRecord> {
    const data: {
      name?: string;
      passwordHash?: string;
      permissions?: string[];
      active?: boolean;
    } = {};

    if (input.name !== undefined) data.name = String(input.name).trim();
    if (input.permissions !== undefined) data.permissions = sanitizePermissions(input.permissions);
    if (input.active !== undefined) data.active = Boolean(input.active);
    if (input.password) {
      if (input.password.length < 8) throw new Error("Wachtwoord moet minimaal 8 tekens zijn.");
      data.passwordHash = hashPassword(input.password);
    }

    const user = await this.prisma.adminUser.update({ where: { id }, data });
    return this.toRecord(user);
  }

  async remove(id: string) {
    await this.prisma.adminUser.delete({ where: { id } });
    return { message: "Gebruiker verwijderd." };
  }
}
