import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminNewsletterController, PublicNewsletterController } from "./newsletter.controller";
import { NewsletterService } from "./newsletter.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicNewsletterController, AdminNewsletterController],
  providers: [NewsletterService]
})
export class NewsletterModule {}
