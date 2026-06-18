import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
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
@UseGuards(AdminGuard)
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get("content")
  getContent() {
    return this.contentService.getContent();
  }

  @Put("content")
  saveContent(@Body() body: unknown) {
    return this.contentService.saveContent(body);
  }
}
