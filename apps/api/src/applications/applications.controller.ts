import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { CreateApplicationInput, UpdateApplicationStatusInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { ApplicationsService } from "./applications.service";

@Controller("api")
export class PublicApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post("applications")
  create(@Body() body: CreateApplicationInput) {
    return this.applicationsService.create(body);
  }
}

@Controller("api/admin")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get("applications")
  @RequirePermissions("applications")
  list() {
    return this.applicationsService.list();
  }

  @Patch("applications/:id/status")
  @RequirePermissions("applications")
  updateStatus(@Param("id") id: string, @Body() body: UpdateApplicationStatusInput) {
    return this.applicationsService.updateStatus(id, body);
  }
}
