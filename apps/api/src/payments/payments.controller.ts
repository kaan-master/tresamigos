import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
  Req,
  Res,
  UseGuards
} from "@nestjs/common";
import type { Request, Response } from "express";
import { FranchiseShopGuard } from "../franchise/franchise-shop.guard";
import type { FranchiseShopSessionPayload } from "../franchise/franchise-shop-auth.service";
import { FranchiseShopService } from "../franchise/franchise-shop.service";
import { MollieService, MollieServiceError } from "../mollie/mollie.service";

@Controller("api/payments/mollie")
export class PaymentsController {
  constructor(
    private readonly mollie: MollieService,
    private readonly franchiseShop: FranchiseShopService
  ) {}

  @Post("webhook")
  async webhook(@Req() req: Request, @Res() res: Response, @Body() body: { id?: string }) {
    const paymentId = String(body?.id || (req.body as { id?: string })?.id || "").trim();
    if (!paymentId) {
      return res.status(200).send("ok");
    }
    try {
      const { key } = await this.mollie.assertActiveApiKey();
      const result = await this.franchiseShop.settleMolliePayment(key, paymentId);
      if (result.orderMissing) {
        return res.status(404).send("order missing");
      }
    } catch (error) {
      // Mollie verwacht snelle 200; log fouten maar blokkeer retries alleen bij harde missers.
      console.error("[mollie webhook]", error instanceof Error ? error.message : error);
    }
    return res.status(200).send("ok");
  }

  @Get("status")
  @UseGuards(FranchiseShopGuard)
  async status(
    @Req() req: { franchiseSession: FranchiseShopSessionPayload },
    @Query("orderId") orderId?: string,
    @Query("paymentId") paymentId?: string
  ) {
    try {
      return await this.franchiseShop.getPaymentStatus(req.franchiseSession, {
        orderId: String(orderId || "").trim(),
        paymentId: String(paymentId || "").trim()
      });
    } catch (error) {
      if (error instanceof MollieServiceError) {
        throw new HttpException({ message: error.message }, error.status);
      }
      throw error;
    }
  }

  @Post("create")
  @UseGuards(FranchiseShopGuard)
  async create(
    @Req() req: { franchiseSession: FranchiseShopSessionPayload },
    @Body() body: { orderId?: string }
  ) {
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) throw new BadRequestException({ message: "orderId is verplicht." });
    try {
      return await this.franchiseShop.startIdealPayment(req.franchiseSession, orderId);
    } catch (error) {
      if (error instanceof MollieServiceError) {
        throw new HttpException({ message: error.message }, error.status);
      }
      throw error;
    }
  }
}
