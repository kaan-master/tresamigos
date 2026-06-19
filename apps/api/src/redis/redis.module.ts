import { Global, Injectable, Logger, Module, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  private available = false;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6380", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false
    });
    this.client.on("error", () => undefined);
    void this.client
      .connect()
      .then(() => {
        this.available = true;
      })
      .catch(() => {
        this.logger.warn("Redis niet bereikbaar — sessies vallen terug op geheugen (alleen dev).");
      });
  }

  isAvailable() {
    return this.available || this.client.status === "ready";
  }

  async onModuleDestroy() {
    if (this.available) await this.client.quit();
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {}
