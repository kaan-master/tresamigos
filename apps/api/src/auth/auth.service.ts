import { Injectable } from "@nestjs/common";
import { ADMIN_TAB_IDS, type AdminSessionUser, type AdminTabId } from "@tresamigos/types";
import { createSessionToken, passwordMatches, verifyPassword } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";
import { RedisService } from "../redis/redis.module";

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export interface AdminSessionPayload {
  role: "master" | "employee";
  userId?: string;
  name: string;
  email: string;
  permissions: AdminTabId[];
}

function allPermissions(): AdminTabId[] {
  return [...ADMIN_TAB_IDS];
}

function sanitizePermissions(input: string[] | undefined): AdminTabId[] {
  const allowed = new Set<string>(ADMIN_TAB_IDS);
  const mapped = (input || []).map((item) => (item === "videos" ? "media" : item));
  return mapped.filter((item): item is AdminTabId => allowed.has(item));
}

@Injectable()
export class AuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService
  ) {}

  private sessionKey(token: string) {
    return `session:${token}`;
  }

  async login(email: string | undefined, password: string): Promise<{ token: string; user: AdminSessionUser } | null> {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (normalizedEmail) {
      const account = await this.prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
      if (!account || !account.active || !verifyPassword(password, account.passwordHash)) return null;

      const user: AdminSessionUser = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: "employee",
        permissions: sanitizePermissions(account.permissions)
      };
      const token = createSessionToken();
      await this.storeSession(token, {
        role: "employee",
        userId: account.id,
        name: account.name,
        email: account.email,
        permissions: user.permissions
      });
      return { token, user };
    }

    if (!passwordMatches(password, process.env)) return null;

    const user: AdminSessionUser = {
      id: "master",
      name: "Beheerder",
      email: "",
      role: "master",
      permissions: allPermissions()
    };
    const token = createSessionToken();
    await this.storeSession(token, {
      role: "master",
      name: user.name,
      email: user.email,
      permissions: user.permissions
    });
    return { token, user };
  }

  async storeSession(token: string, payload: AdminSessionPayload) {
    await this.redis.client.set(this.sessionKey(token), JSON.stringify(payload), "EX", SESSION_TTL_SECONDS);
  }

  async getSession(token: string): Promise<AdminSessionPayload | null> {
    if (!token) return null;
    const raw = await this.redis.client.get(this.sessionKey(token));
    if (!raw) return null;

    if (raw === "1") {
      return {
        role: "master",
        name: "Beheerder",
        email: "",
        permissions: allPermissions()
      };
    }

    try {
      const parsed = JSON.parse(raw) as AdminSessionPayload;
      if (parsed.role === "employee" && parsed.userId) {
        const account = await this.prisma.adminUser.findUnique({ where: { id: parsed.userId } });
        if (!account || !account.active) {
          await this.logout(token);
          return null;
        }
        return {
          role: "employee",
          userId: account.id,
          name: account.name,
          email: account.email,
          permissions: sanitizePermissions(account.permissions)
        };
      }
      return {
        role: parsed.role === "master" ? "master" : "employee",
        userId: parsed.userId,
        name: parsed.name || "Beheerder",
        email: parsed.email || "",
        permissions: parsed.role === "master" ? allPermissions() : sanitizePermissions(parsed.permissions)
      };
    } catch {
      return null;
    }
  }

  async isSessionValid(token: string): Promise<boolean> {
    return Boolean(await this.getSession(token));
  }

  async logout(token: string) {
    if (!token) return;
    await this.redis.client.del(this.sessionKey(token));
  }

  hasPermission(session: AdminSessionPayload | null, permission: AdminTabId): boolean {
    if (!session) return false;
    if (session.role === "master") return true;
    return session.permissions.includes(permission);
  }

  hasAnyPermission(session: AdminSessionPayload | null, permissions: AdminTabId[]): boolean {
    if (!session) return false;
    if (session.role === "master") return true;
    return permissions.some((permission) => session.permissions.includes(permission));
  }

  toSessionUser(session: AdminSessionPayload): AdminSessionUser {
    return {
      id: session.userId || "master",
      name: session.name,
      email: session.email,
      role: session.role,
      permissions: session.permissions
    };
  }

  async checkRateLimit(ip: string): Promise<boolean> {
    const key = `login:${ip || "unknown"}`;
    const count = await this.redis.client.incr(key);
    if (count === 1) {
      await this.redis.client.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    return count <= RATE_LIMIT_MAX;
  }
}
