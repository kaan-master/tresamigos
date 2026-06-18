import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { CreateApplicationInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
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
@UseGuards(AdminGuard)
export class AdminApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get("applications")
  list() {
    return this.applicationsService.list();
  }
}
