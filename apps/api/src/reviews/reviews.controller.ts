import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { CreateReviewInput, UpdateReviewSubmissionInput } from "@tresamigos/types";
import { AdminGuard } from "../auth/admin.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { ReviewSubmissionsService } from "./review-submissions.service";
import { ReviewsService } from "./reviews.service";

@Controller("api/reviews")
export class PublicReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly submissionsService: ReviewSubmissionsService
  ) {}

  @Get()
  list() {
    return this.reviewsService.getPublicReviews();
  }

  @Post("submit")
  submit(@Body() body: CreateReviewInput) {
    return this.submissionsService.create(body);
  }
}

@Controller("api/admin/review-submissions")
@UseGuards(AdminGuard, PermissionsGuard)
@RequirePermissions("reviews")
export class AdminReviewSubmissionsController {
  constructor(private readonly submissionsService: ReviewSubmissionsService) {}

  @Get()
  list() {
    return this.submissionsService.listAdmin();
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateReviewSubmissionInput) {
    return this.submissionsService.updateStatus(id, body);
  }
}
