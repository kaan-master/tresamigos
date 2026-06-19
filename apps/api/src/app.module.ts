import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { join } from "node:path";
import { AnalyticsModule } from "./analytics/analytics.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { ContactModule } from "./contact/contact.module";
import { ContentModule } from "./content/content.module";
import { HealthController } from "./health/health.controller";
import { InstagramModule } from "./instagram/instagram.module";
import { MediaModule } from "./media/media.module";
import { PromoModule } from "./promo/promo.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { ReviewsModule } from "./reviews/reviews.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), ".env"), join(process.cwd(), "../../.env")]
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ContentModule,
    ApplicationsModule,
    MediaModule,
    AnalyticsModule,
    PromoModule,
    ReviewsModule,
    ContactModule,
    InstagramModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
