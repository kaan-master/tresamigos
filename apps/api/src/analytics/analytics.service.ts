import { Injectable } from "@nestjs/common";
import type { AnalyticsDailyEntry, AnalyticsPingInput, AnalyticsSnapshot, PublicAnalyticsStats } from "@tresamigos/types";
import { RedisService } from "../redis/redis.module";

const LIVE_WINDOW_MS = 60_000;
const KEY_TTL_SECONDS = 60 * 60 * 24 * 14;
const DAILY_LOG_DAYS = 14;

@Injectable()
export class AnalyticsService {
  private memoryLive = new Map<string, number>();
  private memoryUniqueToday = new Set<string>();
  private memoryUniqueWeek = new Map<string, Set<string>>();
  private memoryUniquePages = new Map<string, Set<string>>();
  private memoryDayKey = "";

  constructor(private readonly redis: RedisService) {}

  private todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  private weekKeys() {
    const keys: string[] = [];
    const now = new Date();
    for (let index = 0; index < 7; index += 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - index);
      keys.push(day.toISOString().slice(0, 10));
    }
    return keys;
  }

  private dayKeys(days = DAILY_LOG_DAYS) {
    const keys: string[] = [];
    const now = new Date();
    for (let index = days - 1; index >= 0; index -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - index);
      keys.push(day.toISOString().slice(0, 10));
    }
    return keys;
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
        // Redis hiccup — val terug op geheugen voor deze ping
      }
    }

    if (this.memoryDayKey !== today) {
      this.memoryDayKey = today;
      this.memoryUniqueToday.clear();
      this.memoryUniquePages.clear();
    }

    this.memoryLive.set(sessionId, now);
    for (const [id, seenAt] of this.memoryLive) {
      if (seenAt < now - LIVE_WINDOW_MS) this.memoryLive.delete(id);
    }

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
      await Promise.all(
        sourceKeys.map(async (key) => ((await client.exists(key)) ? key : null))
      )
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
    return counts;
  }

  private dailyLogMemory(days = DAILY_LOG_DAYS): AnalyticsDailyEntry[] {
    return this.dayKeys(days).map((date) => ({
      date,
      visitors: date === this.todayKey()
        ? this.memoryUniqueToday.size
        : this.memoryUniqueWeek.get(date)?.size || 0
    }));
  }

  async getPublicStats(): Promise<PublicAnalyticsStats> {
    const today = this.todayKey();
    const now = Date.now();

    if (this.redis.isAvailable()) {
      const client = this.redis.client;
      const [liveNow, viewsToday, dailyLog] = await Promise.all([
        client.zcount("analytics:live", now - LIVE_WINDOW_MS, "+inf"),
        client.scard(`analytics:unique:${today}`),
        this.dailyLogRedis()
      ]);

      return {
        liveNow: Number(liveNow) || 0,
        viewsToday: Number(viewsToday) || 0,
        dailyLog,
        updatedAt: new Date().toISOString()
      };
    }

    for (const [id, seenAt] of this.memoryLive) {
      if (seenAt < now - LIVE_WINDOW_MS) this.memoryLive.delete(id);
    }

    return {
      liveNow: this.memoryLive.size,
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
        client.zcount("analytics:live", now - LIVE_WINDOW_MS, "+inf"),
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
        liveNow: Number(liveNow) || 0,
        viewsToday: Number(viewsToday) || 0,
        viewsWeek: viewsWeek,
        topPages: pageCounts.sort((left, right) => right.views - left.views).slice(0, 8),
        dailyLog,
        updatedAt: new Date().toISOString()
      };
    }

    for (const [id, seenAt] of this.memoryLive) {
      if (seenAt < now - LIVE_WINDOW_MS) this.memoryLive.delete(id);
    }

    return {
      liveNow: this.memoryLive.size,
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
