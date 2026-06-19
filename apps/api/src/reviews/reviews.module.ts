import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ContentModule } from "../content/content.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { AdminReviewSubmissionsController, PublicReviewsController } from "./reviews.controller";
import { ReviewSubmissionsService } from "./review-submissions.service";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [AuthModule, ContentModule, RedisModule, PrismaModule],
  controllers: [PublicReviewsController, AdminReviewSubmissionsController],
  providers: [ReviewsService, ReviewSubmissionsService]
})
export class ReviewsModule {}
