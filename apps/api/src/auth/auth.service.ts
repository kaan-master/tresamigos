import { Injectable } from "@nestjs/common";
import { createSessionToken, passwordMatches } from "@tresamigos/utils";
import { RedisService } from "../redis/redis.module";

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

@Injectable()
export class AuthService {
  constructor(private readonly redis: RedisService) {}

  async login(password: string): Promise<string | null> {
    if (!passwordMatches(password, process.env)) return null;
    const token = createSessionToken();
    await this.redis.client.set(`session:${token}`, "1", "EX", SESSION_TTL_SECONDS);
    return token;
  }

  async isSessionValid(token: string): Promise<boolean> {
    if (!token) return false;
    const exists = await this.redis.client.exists(`session:${token}`);
    return exists === 1;
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
