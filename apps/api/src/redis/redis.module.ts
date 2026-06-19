import { Global, Injectable, Logger, Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;
  private mode: "redis" | "memory" = "memory";

  constructor() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6380", {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 5_000,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 2_000))
    });
    this.client.on("error", () => undefined);
  }

  async onModuleInit() {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        if (this.client.status === "wait") {
          await this.client.connect();
        }
        await this.client.ping();
        this.mode = "redis";
        this.logger.log("Redis verbonden — live analytics actief.");
        return;
      } catch {
        if (attempt < 5) {
          this.logger.warn(`Redis poging ${attempt}/5 mislukt — opnieuw...`);
          await sleep(attempt * 800);
        }
      }
    }
    this.mode = "memory";
    this.logger.warn("Redis niet bereikbaar — analytics in geheugen (herstart wist data).");
  }

  isAvailable() {
    return this.mode === "redis";
  }

  async onModuleDestroy() {
    if (this.mode === "redis") {
      await this.client.quit().catch(() => undefined);
    }
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService]
})
export class RedisModule {}
