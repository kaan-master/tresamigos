import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminContentController, PublicContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { PublicContentGuard } from "./public-content.guard";

@Module({
  imports: [AuthModule],
  controllers: [PublicContentController, AdminContentController],
  providers: [ContentService, PublicContentGuard],
  exports: [ContentService, PublicContentGuard]
})
export class ContentModule {}
