import { Injectable } from "@nestjs/common";
import { createSessionToken, hashPassword, verifyPassword } from "@tresamigos/utils/crypto-node";
import type { FranchiseShopSessionUser } from "@tresamigos/types";
import { PrismaService } from "../prisma/prisma.module";
import { RedisService } from "../redis/redis.module";

const SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface FranchiseShopSessionPayload {
  accountId: string;
  name: string;
  email: string;
  locationId: string;
  locationName: string;
  locationCode: string;
}

@Injectable()
export class FranchiseShopAuthService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService
  ) {}

  private sessionKey(token: string) {
    return `franchise-shop-session:${token}`;
  }

  hash(password: string) {
    return hashPassword(password);
  }

  async login(email: string | undefined, password: string | undefined) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail || !password) return null;

    const account = await this.prisma.franchiseAccount.findUnique({
      where: { email: normalizedEmail },
      include: { location: true }
    });
    if (!account || !account.active || !verifyPassword(password, account.passwordHash)) return null;

    const user: FranchiseShopSessionUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      locationId: account.locationId,
      locationName: account.location.name,
      locationCode: account.location.code
    };
    const token = createSessionToken();
    await this.redis.client.set(
      this.sessionKey(token),
      JSON.stringify({
        accountId: account.id,
        name: account.name,
        email: account.email,
        locationId: account.locationId,
        locationName: account.location.name,
        locationCode: account.location.code
      } satisfies FranchiseShopSessionPayload),
      "EX",
      SESSION_TTL_SECONDS
    );
    return { token, user };
  }

  async getSession(token: string): Promise<FranchiseShopSessionPayload | null> {
    if (!token) return null;
    const raw = await this.redis.client.get(this.sessionKey(token));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as FranchiseShopSessionPayload;
    } catch {
      return null;
    }
  }

  async logout(token: string) {
    if (!token) return;
    await this.redis.client.del(this.sessionKey(token));
  }

  async me(token: string): Promise<FranchiseShopSessionUser | null> {
    const session = await this.getSession(token);
    if (!session) return null;
    const account = await this.prisma.franchiseAccount.findUnique({
      where: { id: session.accountId },
      include: { location: true }
    });
    if (!account || !account.active) return null;
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      locationId: account.locationId,
      locationName: account.location.name,
      locationCode: account.location.code
    };
  }
}
