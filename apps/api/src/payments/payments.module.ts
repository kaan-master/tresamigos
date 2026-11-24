import { Module } from "@nestjs/common";
import { FranchiseModule } from "../franchise/franchise.module";
import { MollieModule } from "../mollie/mollie.module";
import { PaymentsController } from "./payments.controller";

@Module({
  imports: [MollieModule, FranchiseModule],
  controllers: [PaymentsController]
})
export class PaymentsModule {}
