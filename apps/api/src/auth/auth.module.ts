import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { AdminGuard } from "./admin.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PermissionsGuard } from "./permissions.guard";

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard, PermissionsGuard],
  exports: [AuthService, AdminGuard, PermissionsGuard]
})
export class AuthModule {}
