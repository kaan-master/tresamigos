import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { CreateCateringOrderInput, UpdateCateringOrderInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CateringService } from "./catering.service";

@Controller("api")
export class PublicCateringController {
  constructor(private readonly cateringService: CateringService) {}

  @Post("catering")
  create(@Body() body: CreateCateringOrderInput) {
    return this.cateringService.create(body);
  }
}

@Controller("api/admin")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminCateringController {
  constructor(private readonly cateringService: CateringService) {}

  @Get("catering-orders")
  @RequirePermissions("catering")
  list() {
    return this.cateringService.list();
  }

  @Patch("catering-orders/:id")
  @RequirePermissions("catering")
  update(@Param("id") id: string, @Body() body: UpdateCateringOrderInput) {
    return this.cateringService.update(id, body);
  }
}
