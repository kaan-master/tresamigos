import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

function parseOrigins(value: string | undefined) {
  return (value || "http://localhost:5180,http://localhost:5181,https://tresamigos.nl,https://www.tresamigos.nl")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function originFromUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

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

/** Blokkeert kale browser-opens van /api/content; alleen requests vanaf toegestane site-origins. */
@Injectable()
export class PublicContentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      method?: string;
    }>();

    const allowed = new Set(parseOrigins(process.env.CORS_ORIGINS));
    const isDev = process.env.NODE_ENV !== "production";
    const origin = (request.headers.origin || "").replace(/\/$/, "");
    const refererOrigin = originFromUrl(request.headers.referer);

    const candidate = origin || refererOrigin;
    if (candidate && (allowed.has(candidate) || (isDev && isPrivateDevOrigin(candidate)))) {
      return true;
    }

    throw new ForbiddenException({
      message: "Directe toegang tot content API is niet toegestaan."
    });
  }
}
