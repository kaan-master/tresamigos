import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { AdminIntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";

@Module({
  imports: [AuthModule, MailModule],
  controllers: [AdminIntegrationsController],
  providers: [IntegrationsService]
})
export class IntegrationsModule {}
