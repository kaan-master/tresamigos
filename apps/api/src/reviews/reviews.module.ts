import { Module } from "@nestjs/common";
import { ContentModule } from "../content/content.module";
import { RedisModule } from "../redis/redis.module";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [ContentModule, RedisModule],
  controllers: [ReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule {}
