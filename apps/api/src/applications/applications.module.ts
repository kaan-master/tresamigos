import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminApplicationsController, PublicApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";

@Module({
  imports: [AuthModule],
  controllers: [PublicApplicationsController, AdminApplicationsController],
  providers: [ApplicationsService]
})
export class ApplicationsModule {}
