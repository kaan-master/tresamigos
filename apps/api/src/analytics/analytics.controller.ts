import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { AnalyticsPingInput, AnalyticsSnapshot } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { AnalyticsService } from "./analytics.service";

@Controller("api/analytics")
export class PublicAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("ping")
  ping(@Body() body: AnalyticsPingInput) {
    return this.analyticsService.ping(body);
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
