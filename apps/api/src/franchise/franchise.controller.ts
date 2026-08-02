import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import type { CreateFranchiseInquiryInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { FranchiseService } from "./franchise.service";

@Controller("api")
export class PublicFranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Post("franchise")
  create(@Body() body: CreateFranchiseInquiryInput) {
    return this.franchiseService.create(body);
  }
}

@Controller("api/admin")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminFranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get("franchise")
  @RequirePermissions("franchise")
  list() {
    return this.franchiseService.list();
  }
}
