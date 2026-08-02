import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { NewsletterSubscribeInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { NewsletterService } from "./newsletter.service";

@Controller("api")
export class PublicNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post("newsletter/subscribe")
  subscribe(@Body() body: NewsletterSubscribeInput) {
    return this.newsletterService.subscribe(body);
  }
}

@Controller("api/admin")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get("newsletter")
  @RequirePermissions("newsletter")
  list() {
    return this.newsletterService.list();
  }

  @Delete("newsletter/:email")
  @RequirePermissions("newsletter")
  remove(@Param("email") email: string) {
    return this.newsletterService.remove(decodeURIComponent(email));
  }
}
