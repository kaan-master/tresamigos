import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminFranchiseController, PublicFranchiseController } from "./franchise.controller";
import { FranchiseService } from "./franchise.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicFranchiseController, AdminFranchiseController],
  providers: [FranchiseService]
})
export class FranchiseModule {}
