import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminAnalyticsController, PublicAnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicAnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService]
})
export class AnalyticsModule {}
