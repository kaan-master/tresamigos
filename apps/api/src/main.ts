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
  const isDev = process.env.NODE_ENV !== "production";

  function isPrivateDevOrigin(origin: string) {
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol !== "http:" && protocol !== "https:") return false;
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true;
      if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
      if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
      if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)) return true;
      return false;
    } catch {
      return false;
    }
  }

  app.enableCors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (isDev && isPrivateDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true
  });

  const port = Number(process.env.PORT || 3100);
  await app.listen(port, "0.0.0.0");
  console.log(`Tres Amigos API draait op http://0.0.0.0:${port}`);
}

bootstrap();
