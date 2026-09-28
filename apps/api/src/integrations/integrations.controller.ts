import { Body, Controller, Get, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type {
  ClearGoogleOAuthSecretInput,
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

  @Post("integrations/mailrelay/google/clear-secret")
  @RequirePermissions("integrations")
  clearGoogleSecret(@Body() body: ClearGoogleOAuthSecretInput) {
    return this.integrationsService.clearGoogleOAuthSecret(body).then((integrations) => ({ integrations }));
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

  @Get("integrations/mailrelay/google/start")
  @RequirePermissions("integrations")
  startGoogle(
    @Query("category") category: string | undefined,
    @Query("loginHint") loginHint: string | undefined,
    @Req() req: { headers: Record<string, string | string[] | undefined>; protocol?: string }
  ) {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
    const origin = host ? `${proto}://${host}` : undefined;
    const normalizedCategory =
      category === "applications" || category === "catering" || category === "franchise" || category === "other"
        ? category
        : undefined;
    return this.integrationsService.startGoogleOAuth(origin, {
      category: normalizedCategory,
      loginHint
    });
  }
}

@Controller("api")
export class PublicIntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get("integrations")
  @UseGuards(PublicContentGuard)
  get() {
    return this.integrationsService.getPublicSettings().then((integrations) => ({ integrations }));
  }

  @Get("integrations/mailrelay/google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string | undefined,
    @Req() req: { headers: Record<string, string | string[] | undefined>; protocol?: string },
    @Res() res: Response
  ) {
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");
    const origin = host ? `${proto}://${host}` : undefined;
    try {
      if (error) throw new Error(`Google login geannuleerd (${error}).`);
      const redirect = await this.integrationsService.handleGoogleOAuthCallback(code || "", state || "", origin);
      return res.redirect(redirect);
    } catch (callbackError) {
      const message = encodeURIComponent(
        callbackError instanceof Error ? callbackError.message : "Google login mislukt."
      );
      const adminBase = (process.env.ADMIN_PUBLIC_URL || "http://localhost:5181").replace(/\/$/, "");
      const path = adminBase.includes("/admin") ? "" : "/admin/";
      return res.redirect(
        `${adminBase}${path}?tab=siteSettings&view=integrations&sub=mail&googleMail=error&message=${message}`
      );
    }
  }
}
