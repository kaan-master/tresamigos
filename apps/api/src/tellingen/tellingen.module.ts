import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminTellingenController, PublicTellingController } from "./tellingen.controller";
import { TellingenAuthService } from "./tellingen-auth.service";
import { TellingStaffGuard } from "./tellingen.guard";
import { TellingenService } from "./tellingen.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicTellingController, AdminTellingenController],
  providers: [TellingenAuthService, TellingenService, TellingStaffGuard]
})
export class TellingenModule {}
