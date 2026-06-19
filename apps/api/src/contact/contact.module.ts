import { Module } from "@nestjs/common";
import { ContentModule } from "../content/content.module";
import { MailModule } from "../mail/mail.module";
import { ContactController } from "./contact.controller";
import { ContactService } from "./contact.service";

@Module({
  imports: [ContentModule, MailModule],
  controllers: [ContactController],
  providers: [ContactService]
})
export class ContactModule {}
