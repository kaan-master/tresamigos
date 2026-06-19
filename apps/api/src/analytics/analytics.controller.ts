import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { AnalyticsPingInput, AnalyticsSnapshot } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { AnalyticsService } from "./analytics.service";

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

@Controller("api/analytics")
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("ping")
  ping(@Body() body: AnalyticsPingInput, @Req() req: Request) {
    return this.analyticsService.ping(body, clientIp(req));
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
