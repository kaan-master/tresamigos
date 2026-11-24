import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { MollieModule } from "../mollie/mollie.module";
import { AdminFranchiseController, PublicFranchiseController } from "./franchise.controller";
import { AdminFranchiseShopController, PublicFranchiseShopController } from "./franchise-shop.controller";
import { FranchiseShopAuthService } from "./franchise-shop-auth.service";
import { FranchiseShopGuard } from "./franchise-shop.guard";
import { FranchiseShopService } from "./franchise-shop.service";
import { FranchiseService } from "./franchise.service";

@Module({
  imports: [AuthModule, MailModule, MollieModule],
  controllers: [
    PublicFranchiseController,
    AdminFranchiseController,
    PublicFranchiseShopController,
    AdminFranchiseShopController
  ],
  providers: [FranchiseService, FranchiseShopAuthService, FranchiseShopService, FranchiseShopGuard],
  exports: [FranchiseShopService, FranchiseShopAuthService, FranchiseShopGuard]
})
export class FranchiseModule {}
