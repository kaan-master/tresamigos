import { Module } from "@nestjs/common";
import { ContentModule } from "../content/content.module";
import { RedisModule } from "../redis/redis.module";
import { InstagramController } from "./instagram.controller";
import { InstagramService } from "./instagram.service";

@Module({
  imports: [ContentModule, RedisModule],
  controllers: [InstagramController],
  providers: [InstagramService]
})
export class InstagramModule {}
