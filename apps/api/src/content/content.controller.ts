import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { ContentService } from "./content.service";

@Controller("api")
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get("content")
  getContent() {
    return this.contentService.getContent();
  }
}

@Controller("api/admin")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get("content")
  getContent() {
    return this.contentService.getContent();
  }

  @Put("content")
  @RequirePermissions("home", "locations", "products", "media", "seo", "footer")
  saveContent(@Body() body: unknown) {
    return this.contentService.saveContent(body);
  }
}
