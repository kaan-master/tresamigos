import { Body, Controller, Post } from "@nestjs/common";
import type { PromoSubscribeInput } from "@tresamigos/types";
import { PromoService } from "./promo.service";

@Controller("api")
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Post("promo/subscribe")
  subscribe(@Body() body: PromoSubscribeInput) {
    return this.promoService.subscribe(body);
  }
}
