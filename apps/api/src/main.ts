import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { json, urlencoded } from "express";
import { join } from "node:path";
import { AppModule } from "./app.module";
import { ASSETS_ROOT, PUBLIC_ASSETS_ROOT } from "./paths";

const BODY_LIMIT = "15mb";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));
  app.set("trust proxy", true);
  app.useStaticAssets(ASSETS_ROOT, { prefix: "/assets/" });
  app.useStaticAssets(PUBLIC_ASSETS_ROOT, { prefix: "/assets/" });
  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5180,http://localhost:5181")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true
  });

  const port = Number(process.env.PORT || 3100);
  await app.listen(port);
  console.log(`Tres Amigos API draait op http://localhost:${port}`);
}

bootstrap();
