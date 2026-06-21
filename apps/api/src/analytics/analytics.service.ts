import { Injectable } from "@nestjs/common";
import type { AnalyticsDailyEntry, AnalyticsPingInput, AnalyticsSnapshot, PublicAnalyticsStats } from "@tresamigos/types";
import { RedisService } from "../redis/redis.module";

/** Geen ping meer binnen dit venster → niet meer "live". (site pingt elke 3s) */
const LIVE_WINDOW_MS = 12_000;
const KEY_TTL_SECONDS = 60 * 60 * 24 * 90;
const DAILY_LOG_DAYS = 90;
const TIMEZONE = "Europe/Amsterdam";

@Injectable()
export class AnalyticsService {
  private memoryLive = new Map<string, number>();
  private memoryUniqueToday = new Set<string>();
  private memoryUniqueWeek = new Map<string, Set<string>>();
  private memoryUniquePages = new Map<string, Set<string>>();
  private memoryDayKey = "";

  constructor(private readonly redis: RedisService) {}

  private dateKey(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
  }

  private todayKey() {
    return this.dateKey();
  }

  private shiftDateKey(base: string, offsetDays: number) {
    const [year, month, day] = base.split("-").map(Number);
    const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays, 12));
    return this.dateKey(shifted);
  }

  private weekKeys() {
    const today = this.todayKey();
    return Array.from({ length: 7 }, (_, index) => this.shiftDateKey(today, -index));
  }

  private dayKeys(days = DAILY_LOG_DAYS) {
    const today = this.todayKey();
    return Array.from({ length: days }, (_, index) => this.shiftDateKey(today, -(days - 1 - index)));
  }

  private normalizePath(path: string) {
    const cleaned = path.trim() || "/";
    return cleaned.startsWith("/") ? cleaned.slice(0, 120) : `/${cleaned}`.slice(0, 120);
  }

  private normalizeIp(ip: string) {
    const cleaned = String(ip || "").trim().slice(0, 80);
    if (!cleaned) return "unknown";
    if (cleaned === "::1") return "127.0.0.1";
    if (cleaned.startsWith("::ffff:")) return cleaned.slice(7);
    return cleaned;
  }

  private pruneMemoryLive(now: number) {
    for (const [id, seenAt] of this.memoryLive) {
      if (seenAt < now - LIVE_WINDOW_MS) this.memoryLive.delete(id);
    }
  }

  private async cleanupLiveSessions(now: number) {
    if (this.redis.isAvailable()) {
      try {
        await this.redis.client.zremrangebyscore("analytics:live", 0, now - LIVE_WINDOW_MS);
      } catch {
        // ignore
      }
      return;
    }
    this.pruneMemoryLive(now);
  }

  private async countLiveSessions(now: number) {
    await this.cleanupLiveSessions(now);
    if (this.redis.isAvailable()) {
      return Number(await this.redis.client.zcount("analytics:live", now - LIVE_WINDOW_MS, "+inf")) || 0;
    }
    this.pruneMemoryLive(now);
    return this.memoryLive.size;
  }

  async ping(input: AnalyticsPingInput, ip: string) {
    const sessionId = String(input.sessionId || "").slice(0, 80);
    const path = this.normalizePath(String(input.path || "/"));
    const visitorId = this.normalizeIp(ip);
    if (!sessionId) return { ok: true };

    const now = Date.now();
    const today = this.todayKey();

    if (this.redis.isAvailable()) {
      try {
        const client = this.redis.client;
        const uniqueDayKey = `analytics:unique:${today}`;
        const uniquePageKey = `analytics:unique:page:${today}:${path}`;

        await client.zadd("analytics:live", now, sessionId);
        await client.zremrangebyscore("analytics:live", 0, now - LIVE_WINDOW_MS);
        await client.sadd(uniqueDayKey, visitorId);
        await client.sadd(uniquePageKey, visitorId);
        await client.expire(uniqueDayKey, KEY_TTL_SECONDS);
        await client.expire(uniquePageKey, KEY_TTL_SECONDS);
        return { ok: true };
      } catch {
        // Redis hiccup — val terug op geheugen
      }
    }

    if (this.memoryDayKey !== today) {
      this.memoryDayKey = today;
      this.memoryUniqueToday.clear();
      this.memoryUniquePages.clear();
    }

    this.memoryLive.set(sessionId, now);
    this.pruneMemoryLive(now);
    this.memoryUniqueToday.add(visitorId);

    if (!this.memoryUniqueWeek.has(today)) {
      this.memoryUniqueWeek.set(today, new Set());
    }
    this.memoryUniqueWeek.get(today)?.add(visitorId);

    if (!this.memoryUniquePages.has(path)) {
      this.memoryUniquePages.set(path, new Set());
    }
    this.memoryUniquePages.get(path)?.add(visitorId);

    return { ok: true };
  }

  private async uniqueWeekCountRedis() {
    const client = this.redis.client;
    const weekKeys = this.weekKeys();
    const tempKey = `analytics:unique:week:${weekKeys[0]}`;
    const sourceKeys = weekKeys.map((day) => `analytics:unique:${day}`);

    await client.del(tempKey);
    const existingKeys = (
      await Promise.all(sourceKeys.map(async (key) => ((await client.exists(key)) ? key : null)))
    ).filter((key): key is string => Boolean(key));

    if (!existingKeys.length) return 0;

    await client.sunionstore(tempKey, ...existingKeys);
    await client.expire(tempKey, KEY_TTL_SECONDS);
    return Number(await client.scard(tempKey)) || 0;
  }

  private uniqueWeekCountMemory() {
    const merged = new Set<string>();
    for (const day of this.weekKeys()) {
      for (const visitor of this.memoryUniqueWeek.get(day) || []) {
        merged.add(visitor);
      }
    }
    return merged.size;
  }

  private async dailyLogRedis(days = DAILY_LOG_DAYS): Promise<AnalyticsDailyEntry[]> {
    const client = this.redis.client;
    const dates = this.dayKeys(days);
    const counts = await Promise.all(
      dates.map(async (date) => ({
        date,
        visitors: Number(await client.scard(`analytics:unique:${date}`)) || 0
      }))
    );
    return counts.filter((entry) => entry.visitors > 0);
  }

  private dailyLogMemory(days = DAILY_LOG_DAYS): AnalyticsDailyEntry[] {
    return this.dayKeys(days)
      .map((date) => ({
        date,
        visitors:
          date === this.todayKey()
            ? this.memoryUniqueToday.size
            : this.memoryUniqueWeek.get(date)?.size || 0
      }))
      .filter((entry) => entry.visitors > 0);
  }

  async getPublicStats(): Promise<PublicAnalyticsStats> {
    const today = this.todayKey();
    const now = Date.now();

    if (this.redis.isAvailable()) {
      const client = this.redis.client;
      const [liveNow, viewsToday, dailyLog] = await Promise.all([
        this.countLiveSessions(now),
        client.scard(`analytics:unique:${today}`),
        this.dailyLogRedis()
      ]);

      return {
        liveNow,
        viewsToday: Number(viewsToday) || 0,
        dailyLog,
        updatedAt: new Date().toISOString()
      };
    }

    return {
      liveNow: await this.countLiveSessions(now),
      viewsToday: this.memoryUniqueToday.size,
      dailyLog: this.dailyLogMemory(),
      updatedAt: new Date().toISOString()
    };
  }

  async getSnapshot(): Promise<AnalyticsSnapshot> {
    const today = this.todayKey();
    const now = Date.now();

    if (this.redis.isAvailable()) {
      const client = this.redis.client;
      const [liveNow, viewsToday, viewsWeek, pageKeys, dailyLog] = await Promise.all([
        this.countLiveSessions(now),
        client.scard(`analytics:unique:${today}`),
        this.uniqueWeekCountRedis(),
        client.keys(`analytics:unique:page:${today}:*`),
        this.dailyLogRedis()
      ]);

      const pageCounts = await Promise.all(
        pageKeys.map(async (key) => {
          const views = Number(await client.scard(key)) || 0;
          const path = key.replace(`analytics:unique:page:${today}:`, "");
          return { path, views };
        })
      );

      return {
        liveNow,
        viewsToday: Number(viewsToday) || 0,
        viewsWeek,
        topPages: pageCounts.sort((left, right) => right.views - left.views).slice(0, 8),
        dailyLog,
        updatedAt: new Date().toISOString()
      };
    }

    return {
      liveNow: await this.countLiveSessions(now),
      viewsToday: this.memoryUniqueToday.size,
      viewsWeek: this.uniqueWeekCountMemory(),
      topPages: [...this.memoryUniquePages.entries()]
        .map(([path, visitors]) => ({ path, views: visitors.size }))
        .sort((left, right) => right.views - left.views)
        .slice(0, 8),
      dailyLog: this.dailyLogMemory(),
      updatedAt: new Date().toISOString()
    };
  }
}
