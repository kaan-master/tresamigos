import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { ContentModule } from "./content/content.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ContentModule,
    ApplicationsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
