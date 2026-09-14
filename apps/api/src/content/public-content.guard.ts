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

function hostsFromOrigins(origins: string[]) {
  const hosts = new Set<string>();
  for (const origin of origins) {
    try {
      hosts.add(new URL(origin).host.toLowerCase());
    } catch {
      /* ignore invalid origin */
    }
  }
  return hosts;
}

function requestHost(headers: Record<string, string | undefined>) {
  const forwarded = String(headers["x-forwarded-host"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const host = (forwarded || String(headers.host || "")).trim().toLowerCase();
  return host;
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

function header(headers: Record<string, string | undefined>, name: string) {
  return String(headers[name] || "").trim().toLowerCase();
}

/** Blokkeert kale browser-opens van /api/content; same-origin fetches vanaf de site blijven toegestaan. */
@Injectable()
export class PublicContentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      method?: string;
    }>();

    const allowed = parseOrigins(process.env.CORS_ORIGINS);
    const allowedOrigins = new Set(allowed);
    const allowedHosts = hostsFromOrigins(allowed);
    const isDev = process.env.NODE_ENV !== "production";
    const origin = (request.headers.origin || "").replace(/\/$/, "");
    const refererOrigin = originFromUrl(request.headers.referer);
    const candidate = origin || refererOrigin;

    if (candidate && (allowedOrigins.has(candidate) || (isDev && isPrivateDevOrigin(candidate)))) {
      return true;
    }

    const site = header(request.headers, "sec-fetch-site");
    const dest = header(request.headers, "sec-fetch-dest");
    const mode = header(request.headers, "sec-fetch-mode");
    const host = requestHost(request.headers);
    const hostAllowed = Boolean(host && allowedHosts.has(host));
    const sameSiteFetch = site === "same-origin" || site === "same-site";
    const documentNavigation = dest === "document" || mode === "navigate";

    if (hostAllowed && sameSiteFetch && !documentNavigation) {
      return true;
    }

    // Oudere browsers sturen geen Sec-Fetch-*; same-origin GET via nginx heeft dan alleen Host.
    if (hostAllowed && !site && !documentNavigation) {
      return true;
    }

    throw new ForbiddenException({
      message: "Directe toegang tot content API is niet toegestaan."
    });
  }
}
