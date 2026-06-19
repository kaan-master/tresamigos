import { Injectable } from "@nestjs/common";
import type { AnalyticsPingInput, AnalyticsSnapshot } from "@tresamigos/types";
import { RedisService } from "../redis/redis.module";

const LIVE_WINDOW_MS = 45_000;

@Injectable()
export class AnalyticsService {
  private memoryLive = new Map<string, number>();
  private memoryDayViews = 0;
  private memoryWeekViews = 0;
  private memoryPages = new Map<string, number>();
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

  private normalizePath(path: string) {
    const cleaned = path.trim() || "/";
    return cleaned.startsWith("/") ? cleaned.slice(0, 120) : `/${cleaned}`.slice(0, 120);
  }

  async ping(input: AnalyticsPingInput) {
    const sessionId = String(input.sessionId || "").slice(0, 80);
    const path = this.normalizePath(String(input.path || "/"));
    if (!sessionId) return { ok: true };

    const now = Date.now();
    const today = this.todayKey();

    if (this.redis.isAvailable()) {
      const client = this.redis.client;
      await client.zadd("analytics:live", now, sessionId);
      await client.zremrangebyscore("analytics:live", 0, now - LIVE_WINDOW_MS);
      await client.incr(`analytics:views:${today}`);
      await client.incr(`analytics:page:${today}:${path}`);
      await client.expire(`analytics:views:${today}`, 60 * 60 * 24 * 14);
      await client.expire(`analytics:page:${today}:${path}`, 60 * 60 * 24 * 14);
      return { ok: true };
    }

    if (this.memoryDayKey !== today) {
      this.memoryDayKey = today;
      this.memoryDayViews = 0;
      this.memoryPages.clear();
    }

    this.memoryLive.set(sessionId, now);
    for (const [id, seenAt] of this.memoryLive) {
      if (seenAt < now - LIVE_WINDOW_MS) this.memoryLive.delete(id);
    }
    this.memoryDayViews += 1;
    this.memoryWeekViews += 1;
    this.memoryPages.set(path, (this.memoryPages.get(path) || 0) + 1);
    return { ok: true };
  }

  async getSnapshot(): Promise<AnalyticsSnapshot> {
    const today = this.todayKey();
    const now = Date.now();

    if (this.redis.isAvailable()) {
      const client = this.redis.client;
      const weekKeys = this.weekKeys();
      const [liveNow, viewsToday, weekCounts, pageKeys] = await Promise.all([
        client.zcount("analytics:live", now - LIVE_WINDOW_MS, "+inf"),
        client.get(`analytics:views:${today}`),
        Promise.all(weekKeys.map((key) => client.get(`analytics:views:${key}`))),
        client.keys(`analytics:page:${today}:*`)
      ]);

      const pageCounts = await Promise.all(
        pageKeys.map(async (key) => {
          const views = Number(await client.get(key)) || 0;
          const path = key.replace(`analytics:page:${today}:`, "");
          return { path, views };
        })
      );

      return {
        liveNow: Number(liveNow) || 0,
        viewsToday: Number(viewsToday) || 0,
        viewsWeek: weekCounts.reduce((total, value) => total + (Number(value) || 0), 0),
        topPages: pageCounts.sort((left, right) => right.views - left.views).slice(0, 6),
        updatedAt: new Date().toISOString()
      };
    }

    for (const [id, seenAt] of this.memoryLive) {
      if (seenAt < now - LIVE_WINDOW_MS) this.memoryLive.delete(id);
    }

    return {
      liveNow: this.memoryLive.size,
      viewsToday: this.memoryDayViews,
      viewsWeek: this.memoryWeekViews,
      topPages: [...this.memoryPages.entries()]
        .map(([path, views]) => ({ path, views }))
        .sort((left, right) => right.views - left.views)
        .slice(0, 6),
      updatedAt: new Date().toISOString()
    };
  }
}
