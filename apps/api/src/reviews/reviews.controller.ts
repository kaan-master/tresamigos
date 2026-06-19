import { Controller, Get } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";

@Controller("api")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("reviews")
  list() {
    return this.reviewsService.getPublicReviews();
  }
}
