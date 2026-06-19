import { Module } from "@nestjs/common";
import { ContentModule } from "../content/content.module";
import { MailModule } from "../mail/mail.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PromoController } from "./promo.controller";
import { PromoService } from "./promo.service";

@Module({
  imports: [PrismaModule, ContentModule, MailModule],
  controllers: [PromoController],
  providers: [PromoService]
})
export class PromoModule {}
