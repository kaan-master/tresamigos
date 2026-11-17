import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MollieService } from "./mollie.service";

@Module({
  imports: [PrismaModule],
  providers: [MollieService],
  exports: [MollieService]
})
export class MollieModule {}
