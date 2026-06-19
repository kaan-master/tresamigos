import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { AnalyticsPingInput, AnalyticsSnapshot, PublicAnalyticsStats } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { AnalyticsService } from "./analytics.service";

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

@Controller("api/analytics")
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("ping")
  pingPost(@Body() body: AnalyticsPingInput, @Req() req: Request) {
    return this.analyticsService.ping(body, clientIp(req));
  }

  @Get("ping")
  pingGet(@Query("sid") sid: string, @Query("path") path: string, @Req() req: Request) {
    return this.analyticsService.ping({ sessionId: sid || "", path: path || "/" }, clientIp(req));
  }

  @Get("stats")
  stats(): Promise<PublicAnalyticsStats> {
    return this.analyticsService.getPublicStats();
  }
}

@Controller("api/admin/analytics")
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  snapshot(): Promise<AnalyticsSnapshot> {
    return this.analyticsService.getSnapshot();
  }
}
