import { Injectable, Logger } from "@nestjs/common";
import { isTellingPin, tellingPinHint } from "@tresamigos/utils";
import {
  createSessionToken,
  generateTellingPin,
  hashPassword,
  tellingPinLookup,
  verifyPassword
} from "@tresamigos/utils/crypto-node";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.module";
import { RedisService } from "../redis/redis.module";

const SESSION_TTL_SECONDS = 4 * 60 * 60;
const FAILED_MAX = 3;
const FAIL_WINDOW_SECONDS = 15 * 60;
const BLOCK_SECONDS = 60 * 60;

export interface TellingSessionPayload {
  staffId: string;
  name: string;
}

export interface TellingIpGate {
  blocked: boolean;
  failedCount: number;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

@Injectable()
export class TellingenAuthService {
  private readonly logger = new Logger(TellingenAuthService.name);
  private readonly memoryFails = new Map<string, { count: number; expiresAt: number }>();
  private readonly memoryBlocks = new Map<string, number>();

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService
  ) {}

  pinSecret() {
    return process.env.TELLING_PIN_SECRET || process.env.ADMIN_PASSWORD || "tres-amigos-telling-v1";
  }

  lookupFor(pin: string) {
    return tellingPinLookup(pin, this.pinSecret());
  }

  async uniquePin(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const pin = generateTellingPin();
      const exists = await this.prisma.countStaff.findUnique({ where: { loginLookup: this.lookupFor(pin) } });
      if (!exists) return pin;
    }
    throw new Error("Kon geen uniek inlognummer maken.");
  }

  hashPin(pin: string) {
    return hashPassword(pin);
  }

  hintFor(pin: string) {
    return tellingPinHint(pin);
  }

  normalizePin(value: string | undefined) {
    const pin = String(value || "").replace(/\D/g, "");
    if (!isTellingPin(pin)) return null;
    return pin;
  }

  clientIp(req: Request) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      return this.normalizeIp(forwarded.split(",")[0].trim());
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return this.normalizeIp(forwarded[0].split(",")[0].trim());
    }
    return this.normalizeIp(req.ip || req.socket.remoteAddress || "unknown");
  }

  private sessionKey(token: string) {
    return `telling:${token}`;
  }

  async login(pin: string): Promise<{ token: string; staffId: string; name: string } | null> {
    const lookup = this.lookupFor(pin);
    let staff = await this.prisma.countStaff.findUnique({ where: { loginLookup: lookup } });
    if (!staff || !verifyPassword(pin, staff.loginHash)) {
      const candidates = await this.prisma.countStaff.findMany({ where: { active: true } });
      staff = candidates.find((item) => verifyPassword(pin, item.loginHash)) || null;
      if (staff) {
        await this.prisma.countStaff.update({
          where: { id: staff.id },
          data: {
            loginLookup: lookup,
            loginHint: this.hintFor(pin)
          }
        });
      }
    }
    if (!staff || !staff.active || !verifyPassword(pin, staff.loginHash)) {
      this.logger.warn("Telling-login mislukt.");
      return null;
    }

    const token = createSessionToken();
    await this.storeSession(token, { staffId: staff.id, name: staff.name });
    this.logger.log(`Telling-login ${staff.id}`);
    return { token, staffId: staff.id, name: staff.name };
  }

  async storeSession(token: string, payload: TellingSessionPayload) {
    await this.redis.client.set(this.sessionKey(token), JSON.stringify(payload), "EX", SESSION_TTL_SECONDS);
  }

  async getSession(token: string): Promise<TellingSessionPayload | null> {
    if (!token) return null;
    const raw = await this.redis.client.get(this.sessionKey(token));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as TellingSessionPayload;
      if (!parsed?.staffId) return null;
      const staff = await this.prisma.countStaff.findUnique({ where: { id: parsed.staffId } });
      if (!staff || !staff.active) {
        await this.logout(token);
        return null;
      }
      return { staffId: staff.id, name: staff.name };
    } catch {
      return null;
    }
  }

  async logout(token: string) {
    if (!token) return;
    await this.redis.client.del(this.sessionKey(token));
  }

  async getIpGate(ip: string): Promise<TellingIpGate> {
    const key = this.normalizeIp(ip);
    this.pruneMemory();

    const memoryBlock = this.memoryBlocks.get(key);
    if (memoryBlock && memoryBlock > Date.now()) {
      return this.gate(true, FAILED_MAX, Math.ceil((memoryBlock - Date.now()) / 1000));
    }

    try {
      const blockTtl = await this.redis.client.ttl(this.blockKey(key));
      if (blockTtl > 0) return this.gate(true, FAILED_MAX, blockTtl);
      const failedCount = Number((await this.redis.client.get(this.failKey(key))) || 0);
      return this.gate(failedCount >= FAILED_MAX, failedCount, failedCount >= FAILED_MAX ? BLOCK_SECONDS : 0);
    } catch {
      const fails = this.memoryFails.get(key);
      if (fails && fails.expiresAt > Date.now()) {
        return this.gate(fails.count >= FAILED_MAX, fails.count, fails.count >= FAILED_MAX ? Math.max(1, Math.ceil((fails.expiresAt - Date.now()) / 1000)) : 0);
      }
      return this.gate(false, 0, 0);
    }
  }

  async isBlocked(ip: string) {
    return (await this.getIpGate(ip)).blocked;
  }

  async recordFailedLogin(ip: string): Promise<TellingIpGate> {
    const key = this.normalizeIp(ip);
    this.pruneMemory();

    try {
      const failKey = this.failKey(key);
      const failedCount = await this.redis.client.incr(failKey);
      if (failedCount === 1) await this.redis.client.expire(failKey, FAIL_WINDOW_SECONDS);
      if (failedCount >= FAILED_MAX) {
        await this.redis.client.set(this.blockKey(key), "1", "EX", BLOCK_SECONDS);
        this.memoryBlocks.set(key, Date.now() + BLOCK_SECONDS * 1000);
        this.logger.warn(`Telling-login IP geblokkeerd na ${failedCount} foute codes: ${key}`);
        return this.gate(true, failedCount, BLOCK_SECONDS);
      }
      return this.gate(false, failedCount, 0);
    } catch {
      const current = this.memoryFails.get(key);
      const count = current && current.expiresAt > Date.now() ? current.count + 1 : 1;
      const expiresAt = current && current.expiresAt > Date.now() ? current.expiresAt : Date.now() + FAIL_WINDOW_SECONDS * 1000;
      this.memoryFails.set(key, { count, expiresAt });
      if (count >= FAILED_MAX) {
        this.memoryBlocks.set(key, Date.now() + BLOCK_SECONDS * 1000);
        this.logger.warn(`Telling-login IP geblokkeerd na ${count} foute codes: ${key}`);
        return this.gate(true, count, BLOCK_SECONDS);
      }
      return this.gate(false, count, 0);
    }
  }

  async clearFailedLogins(ip?: string) {
    const key = this.normalizeIp(ip || "");
    this.memoryFails.delete(key);
    this.memoryBlocks.delete(key);
    try {
      if (ip) {
        await this.redis.client.del(this.failKey(key), this.blockKey(key));
      }
    } catch {
      /* ignore */
    }
  }

  blockMessage(retryAfterSeconds: number) {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return `Dit IP-adres is geblokkeerd na 3 foute inlogcodes. Probeer het over ${minutes} minuten opnieuw.`;
  }

  failedMessage(remainingAttempts: number) {
    if (remainingAttempts <= 0) return this.blockMessage(BLOCK_SECONDS);
    if (remainingAttempts === 1) return "Verkeerde code. Nog 1 poging over, daarna wordt dit IP geblokkeerd.";
    return `Verkeerde code. Nog ${remainingAttempts} pogingen over.`;
  }

  private gate(blocked: boolean, failedCount: number, retryAfterSeconds: number): TellingIpGate {
    return {
      blocked,
      failedCount,
      remainingAttempts: Math.max(0, FAILED_MAX - failedCount),
      retryAfterSeconds: blocked ? Math.max(1, retryAfterSeconds) : 0
    };
  }

  private failKey(ip: string) {
    return `telling-login:fail:${ip || "unknown"}`;
  }

  private blockKey(ip: string) {
    return `telling-login:block:${ip || "unknown"}`;
  }

  private normalizeIp(ip: string) {
    const value = (ip || "unknown").trim().replace(/^::ffff:/, "");
    return value || "unknown";
  }

  private pruneMemory() {
    const now = Date.now();
    for (const [ip, entry] of this.memoryFails) {
      if (entry.expiresAt <= now) this.memoryFails.delete(ip);
    }
    for (const [ip, until] of this.memoryBlocks) {
      if (until <= now) this.memoryBlocks.delete(ip);
    }
  }
}
