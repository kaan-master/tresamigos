import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import type { Request, Response } from "express";
import type {
  CountListFilters,
  CountShift,
  CountStatus,
  CreateCountCategoryInput,
  CreateCountListInput,
  CreateCountProductInput,
  CreateCountStaffInput,
  SaveCountSessionInput,
  UpdateCountCategoryInput,
  UpdateCountListInput,
  UpdateCountProductInput,
  UpdateCountStaffInput
} from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { TellingenAuthService } from "./tellingen-auth.service";
import { TellingStaffGuard } from "./tellingen.guard";
import { TellingenService } from "./tellingen.service";

@Controller("api/telling")
export class PublicTellingController {
  constructor(
    private readonly auth: TellingenAuthService,
    private readonly tellingen: TellingenService
  ) {}

  @Post("login")
  async login(@Body() body: { loginNumber?: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = this.auth.clientIp(req);
    const gate = await this.auth.getIpGate(ip);
    if (gate.blocked) {
      res.setHeader("Retry-After", String(gate.retryAfterSeconds));
      throw new HttpException({ message: this.auth.blockMessage(gate.retryAfterSeconds) }, HttpStatus.TOO_MANY_REQUESTS);
    }

    const pin = this.auth.normalizePin(body?.loginNumber);
    if (!pin) {
      throw new HttpException({ message: "Vul je 9-cijferige nummer in." }, HttpStatus.BAD_REQUEST);
    }

    const result = await this.auth.login(pin);
    if (!result) {
      const failed = await this.auth.recordFailedLogin(ip);
      if (failed.blocked) {
        res.setHeader("Retry-After", String(failed.retryAfterSeconds));
        throw new HttpException({ message: this.auth.blockMessage(failed.retryAfterSeconds) }, HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new HttpException({ message: this.auth.failedMessage(failed.remainingAttempts) }, HttpStatus.UNAUTHORIZED);
    }

    await this.auth.clearFailedLogins(ip);
    const staff = await this.tellingen.staffUser(result.staffId);
    return { token: result.token, staff };
  }

  @Post("logout")
  async logout(@Headers("authorization") authorization = "") {
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    await this.auth.logout(token);
    return { message: "Uitgelogd." };
  }

  @Get("me")
  @UseGuards(TellingStaffGuard)
  me(@Req() request: { tellingSession?: { staffId: string } }) {
    return this.tellingen.me(request.tellingSession!.staffId);
  }

  @Get("catalog")
  @UseGuards(TellingStaffGuard)
  async publicCatalog(@Query("listId") listId = "") {
    if (!listId) throw new HttpException({ message: "Kies een tellinglijst." }, HttpStatus.BAD_REQUEST);
    return { categories: await this.tellingen.catalog(true, listId) };
  }

  @Get("counts/current")
  @UseGuards(TellingStaffGuard)
  async current(
    @Req() request: { tellingSession?: { staffId: string } },
    @Query("locationId") locationId = "",
    @Query("shift") shift = "",
    @Query("listId") listId = "",
    @Query("countDate") countDate?: string
  ) {
    if (!locationId) throw new HttpException({ message: "Kies een vestiging." }, HttpStatus.BAD_REQUEST);
    if (!listId) throw new HttpException({ message: "Kies een tellinglijst." }, HttpStatus.BAD_REQUEST);
    const session = await this.tellingen.getCurrentCount(
      request.tellingSession!.staffId,
      locationId,
      shift,
      listId,
      countDate
    );
    return { session };
  }

  @Put("counts")
  @UseGuards(TellingStaffGuard)
  save(@Req() request: { tellingSession?: { staffId: string } }, @Body() body: SaveCountSessionInput) {
    return this.tellingen.saveDraft(request.tellingSession!.staffId, body);
  }

  @Post("counts/:id/submit")
  @UseGuards(TellingStaffGuard)
  submit(@Req() request: { tellingSession?: { staffId: string } }, @Param("id") id: string) {
    return this.tellingen.submit(request.tellingSession!.staffId, id);
  }
}

@Controller("api/admin/tellingen")
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermissions("tellingen")
export class AdminTellingenController {
  constructor(private readonly tellingen: TellingenService) {}

  @Get("staff")
  async staff() {
    return { staff: await this.tellingen.listStaff() };
  }

  @Post("staff")
  async createStaff(@Body() body: CreateCountStaffInput) {
    const result = await this.tellingen.createStaff(body);
    return { ...result, message: "Gebruiker aangemaakt." };
  }

  @Patch("staff/:id")
  async updateStaff(@Param("id") id: string, @Body() body: UpdateCountStaffInput) {
    const result = await this.tellingen.updateStaff(id, body);
    return { ...result, message: "Gebruiker bijgewerkt." };
  }

  @Delete("staff/:id")
  removeStaff(@Param("id") id: string) {
    return this.tellingen.removeStaff(id);
  }

  @Get("lists")
  async lists() {
    return { lists: await this.tellingen.listLists(false) };
  }

  @Post("lists")
  async createList(@Body() body: CreateCountListInput) {
    const list = await this.tellingen.createList(body);
    return { list, message: "Lijst toegevoegd." };
  }

  @Patch("lists/:id")
  async updateList(@Param("id") id: string, @Body() body: UpdateCountListInput) {
    const list = await this.tellingen.updateList(id, body);
    return { list, message: "Lijst bijgewerkt." };
  }

  @Delete("lists/:id")
  removeList(@Param("id") id: string) {
    return this.tellingen.removeList(id);
  }

  @Post("lists/:id/move")
  moveList(@Param("id") id: string, @Body() body: { direction?: "up" | "down" }) {
    return this.tellingen.moveList(id, body.direction === "down" ? "down" : "up").then((lists) => ({ lists }));
  }

  @Get("catalog")
  async catalog(@Query("listId") listId?: string) {
    return { categories: await this.tellingen.catalog(false, listId || undefined) };
  }

  @Post("categories")
  async createCategory(@Body() body: CreateCountCategoryInput) {
    const category = await this.tellingen.createCategory(body);
    return { category, message: "Categorie toegevoegd." };
  }

  @Patch("categories/:id")
  async updateCategory(@Param("id") id: string, @Body() body: UpdateCountCategoryInput) {
    const category = await this.tellingen.updateCategory(id, body);
    return { category, message: "Categorie bijgewerkt." };
  }

  @Delete("categories/:id")
  removeCategory(@Param("id") id: string) {
    return this.tellingen.removeCategory(id);
  }

  @Post("categories/:id/move")
  moveCategory(@Param("id") id: string, @Body() body: { direction?: "up" | "down" }) {
    return this.tellingen.moveCategory(id, body.direction === "down" ? "down" : "up").then((categories) => ({ categories }));
  }

  @Post("products")
  async createProduct(@Body() body: CreateCountProductInput) {
    const product = await this.tellingen.createProduct(body);
    return { product, message: "Product toegevoegd." };
  }

  @Patch("products/:id")
  async updateProduct(@Param("id") id: string, @Body() body: UpdateCountProductInput) {
    const product = await this.tellingen.updateProduct(id, body);
    return { product, message: "Product bijgewerkt." };
  }

  @Delete("products/:id")
  removeProduct(@Param("id") id: string) {
    return this.tellingen.removeProduct(id);
  }

  @Post("products/:id/move")
  moveProduct(@Param("id") id: string, @Body() body: { direction?: "up" | "down" }) {
    return this.tellingen.moveProduct(id, body.direction === "down" ? "down" : "up").then((categories) => ({ categories }));
  }

  @Get("product-stats")
  async productStats(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("locationId") locationId?: string,
    @Query("staffId") staffId?: string,
    @Query("listId") listId?: string,
    @Query("weekday") weekday?: string,
    @Query("shift") shift?: CountShift,
    @Query("status") status?: CountStatus
  ) {
    const filters: CountListFilters = { dateFrom, dateTo, locationId, staffId, listId, weekday, shift, status };
    return this.tellingen.listProductStats(filters);
  }

  @Get("sessions")
  async sessions(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("locationId") locationId?: string,
    @Query("staffId") staffId?: string,
    @Query("listId") listId?: string,
    @Query("weekday") weekday?: string,
    @Query("productId") productId?: string,
    @Query("productName") productName?: string,
    @Query("categoryName") categoryName?: string,
    @Query("shift") shift?: CountShift,
    @Query("status") status?: CountStatus
  ) {
    const filters: CountListFilters = {
      dateFrom,
      dateTo,
      locationId,
      staffId,
      listId,
      weekday,
      productId,
      productName,
      categoryName,
      shift,
      status
    };
    return { sessions: await this.tellingen.listSessions(filters) };
  }

  @Get("sessions/:id")
  async session(@Param("id") id: string) {
    return { session: await this.tellingen.getSession(id) };
  }

  @Get("export")
  async export(
    @Res() response: Response,
    @Query("format") format = "csv",
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("locationId") locationId?: string,
    @Query("staffId") staffId?: string,
    @Query("listId") listId?: string,
    @Query("shift") shift?: CountShift,
    @Query("status") status?: CountStatus
  ) {
    const file = await this.tellingen.exportSessions(
      { dateFrom, dateTo, locationId, staffId, listId, shift, status },
      format === "xlsx" || format === "xls" ? "xlsx" : "csv"
    );
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    response.send(file.body);
  }
}
