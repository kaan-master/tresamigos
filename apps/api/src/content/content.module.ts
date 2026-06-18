import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminContentController, PublicContentController } from "./content.controller";
import { ContentService } from "./content.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService]
})
export class ContentModule {}
