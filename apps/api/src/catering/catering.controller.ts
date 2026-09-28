import { Body, Controller, Get, Param, Patch, Post, Put, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type { CreateCateringOrderInput, UpdateCateringOrderInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { PublicContentGuard } from "../content/public-content.guard";
import { CateringService } from "./catering.service";

@Controller("api")
export class PublicCateringController {
  constructor(private readonly cateringService: CateringService) {}

  @Post("catering")
  create(@Body() body: CreateCateringOrderInput) {
    return this.cateringService.create(body);
  }

  @Get("catering/catalog")
  @UseGuards(PublicContentGuard)
  catalog() {
    return this.cateringService.getPublicSettings();
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

  @Get("catering-orders/:id/invoice.pdf")
  @RequirePermissions("catering")
  async invoicePdf(@Param("id") id: string, @Res() res: Response) {
    const doc = await this.cateringService.getOrderDocument(id, "invoice");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
    res.send(doc.buffer);
  }

  @Get("catering-orders/:id/packing-slip.pdf")
  @RequirePermissions("catering")
  async packingSlipPdf(@Param("id") id: string, @Res() res: Response) {
    const doc = await this.cateringService.getOrderDocument(id, "packing-slip");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
    res.send(doc.buffer);
  }

  @Get("catering/settings")
  @RequirePermissions("catering")
  getSettings() {
    return this.cateringService.getSettings();
  }

  @Put("catering/settings")
  @RequirePermissions("catering")
  saveSettings(@Body() body: unknown) {
    return this.cateringService.saveSettings(body);
  }
}
