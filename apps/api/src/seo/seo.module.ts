import { Module } from "@nestjs/common";
import { ContentModule } from "../content/content.module";
import { SeoController } from "./seo.controller";

@Module({
  imports: [ContentModule],
  controllers: [SeoController]
})
export class SeoModule {}
