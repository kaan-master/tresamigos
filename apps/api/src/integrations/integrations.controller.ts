import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import type { IntegrationTestMailInput, UpdateIntegrationMailRelayInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { IntegrationsService } from "./integrations.service";

@Controller("api/admin")
@UseGuards(AdminGuard, PermissionsGuard)
export class AdminIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get("integrations")
  @RequirePermissions("integrations")
  get() {
    return this.integrationsService.getSettings().then((integrations) => ({ integrations }));
  }

  @Put("integrations/mailrelay")
  @RequirePermissions("integrations")
  updateMailRelay(@Body() body: UpdateIntegrationMailRelayInput) {
    return this.integrationsService.updateMailRelay(body).then((integrations) => ({ integrations }));
  }

  @Post("integrations/mailrelay/test")
  @RequirePermissions("integrations")
  testMailRelay(@Body() body: IntegrationTestMailInput) {
    return this.integrationsService.testMailRelay(body);
  }
}
