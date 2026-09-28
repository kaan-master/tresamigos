import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type {
  CreateFranchiseAccountInput,
  CreateFranchiseShopOrderInput,
  CreateFranchiseShopProductInput,
  UpdateFranchiseAccountInput,
  UpdateFranchiseShopOrderInput,
  UpdateFranchiseShopProductInput
} from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { FranchiseShopAuthService, type FranchiseShopSessionPayload } from "./franchise-shop-auth.service";
import { FranchiseShopGuard } from "./franchise-shop.guard";
import { FranchiseShopService } from "./franchise-shop.service";

@Controller("api/franchise")
export class PublicFranchiseShopController {
  constructor(
    private readonly auth: FranchiseShopAuthService,
    private readonly shop: FranchiseShopService
  ) {}

  @Post("login")
  async login(@Body() body: { email?: string; password?: string }) {
    const result = await this.auth.login(body?.email, body?.password);
    if (!result) {
      throw new UnauthorizedException({ message: "Ongeldige inloggegevens." });
    }
    return result;
  }

  @Post("logout")
  @UseGuards(FranchiseShopGuard)
  async logout(@Req() req: { headers: Record<string, string | undefined> }) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    await this.auth.logout(token);
    return { message: "Uitgelogd." };
  }

  @Get("me")
  @UseGuards(FranchiseShopGuard)
  async me(@Req() req: { headers: Record<string, string | undefined> }) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const user = await this.auth.me(token);
    return { user };
  }

  @Get("shop/catalog")
  @UseGuards(FranchiseShopGuard)
  async catalog(@Req() req: { franchiseSession: FranchiseShopSessionPayload }) {
    return this.shop.catalogForLocation(req.franchiseSession.locationId);
  }

  @Post("shop/orders")
  @UseGuards(FranchiseShopGuard)
  placeOrder(
    @Req() req: { franchiseSession: FranchiseShopSessionPayload },
    @Body() body: CreateFranchiseShopOrderInput
  ) {
    return this.shop.placeOrder(req.franchiseSession, body);
  }

  @Get("shop/orders")
  @UseGuards(FranchiseShopGuard)
  myOrders(@Req() req: { franchiseSession: FranchiseShopSessionPayload }) {
    return this.shop.listMyOrders(req.franchiseSession.accountId);
  }
}

@Controller("api/admin/franchise-shop")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminFranchiseShopController {
  constructor(private readonly shop: FranchiseShopService) {}

  @Get("accounts")
  @RequirePermissions("franchiseShop")
  listAccounts() {
    return this.shop.listAccounts();
  }

  @Post("accounts")
  @RequirePermissions("franchiseShop")
  createAccount(@Body() body: CreateFranchiseAccountInput) {
    return this.shop.createAccount(body);
  }

  @Patch("accounts/:id")
  @RequirePermissions("franchiseShop")
  updateAccount(@Param("id") id: string, @Body() body: UpdateFranchiseAccountInput) {
    return this.shop.updateAccount(id, body);
  }

  @Get("products")
  @RequirePermissions("franchiseShop")
  listProducts() {
    return this.shop.listProducts();
  }

  @Post("products")
  @RequirePermissions("franchiseShop")
  createProduct(@Body() body: CreateFranchiseShopProductInput) {
    return this.shop.createProduct(body);
  }

  @Patch("products/:id")
  @RequirePermissions("franchiseShop")
  updateProduct(@Param("id") id: string, @Body() body: UpdateFranchiseShopProductInput) {
    return this.shop.updateProduct(id, body);
  }

  @Delete("products/:id")
  @RequirePermissions("franchiseShop")
  deleteProduct(@Param("id") id: string) {
    return this.shop.deleteProduct(id);
  }

  @Get("orders")
  @RequirePermissions("franchiseShop")
  listOrders() {
    return this.shop.listOrders();
  }

  @Patch("orders/:id")
  @RequirePermissions("franchiseShop")
  updateOrder(@Param("id") id: string, @Body() body: UpdateFranchiseShopOrderInput) {
    return this.shop.updateOrder(id, body);
  }
}
