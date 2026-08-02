import { Body, Controller, Get, Post, Put, UseGuards } from "@nestjs/common";
import type {
  IntegrationTestMailInput,
  UpdateIntegrationGoogleAdsInput,
  UpdateIntegrationMailRelayInput,
  UpdateIntegrationNewsletterInput
} from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { PublicContentGuard } from "../content/public-content.guard";
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

  @Put("integrations/google-ads")
  @RequirePermissions("integrations")
  updateGoogleAds(@Body() body: UpdateIntegrationGoogleAdsInput) {
    return this.integrationsService.updateGoogleAds(body).then((integrations) => ({ integrations }));
  }

  @Put("integrations/newsletter")
  @RequirePermissions("integrations")
  updateNewsletter(@Body() body: UpdateIntegrationNewsletterInput) {
    return this.integrationsService.updateNewsletter(body).then((integrations) => ({ integrations }));
  }

  @Post("integrations/mailrelay/test")
  @RequirePermissions("integrations")
  testMailRelay(@Body() body: IntegrationTestMailInput) {
    return this.integrationsService.testMailRelay(body);
  }
}

@Controller("api")
@UseGuards(PublicContentGuard)
export class PublicIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get("integrations")
  get() {
    return this.integrationsService.getPublicSettings().then((integrations) => ({ integrations }));
  }
}
