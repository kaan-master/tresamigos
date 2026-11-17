import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ContentModule } from "../content/content.module";
import { MailModule } from "../mail/mail.module";
import { MollieModule } from "../mollie/mollie.module";
import { AdminIntegrationsController, PublicIntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";

@Module({
  imports: [AuthModule, MailModule, ContentModule, MollieModule],
  controllers: [AdminIntegrationsController, PublicIntegrationsController],
  providers: [IntegrationsService]
})
export class IntegrationsModule {}
