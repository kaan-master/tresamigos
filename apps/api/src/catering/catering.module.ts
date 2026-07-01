import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ContentModule } from "../content/content.module";
import { MailModule } from "../mail/mail.module";
import { AdminCateringController, PublicCateringController } from "./catering.controller";
import { CateringService } from "./catering.service";

@Module({
  imports: [AuthModule, ContentModule, MailModule],
  controllers: [PublicCateringController, AdminCateringController],
  providers: [CateringService]
})
export class CateringModule {}
