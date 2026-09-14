import crypto from "node:crypto";

export function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function passwordMatches(password: string, env: NodeJS.ProcessEnv): boolean {
  const hashConfig = env.ADMIN_PASSWORD_HASH || "";
  const passwordConfig = env.ADMIN_PASSWORD || "";

  if (hashConfig.includes(":")) {
    const [salt, expected] = hashConfig.split(":");
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");
    return timingSafeStringEqual(actual, expected);
  }

  if (passwordConfig) return timingSafeStringEqual(password, passwordConfig);
  return false;
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.includes(":")) return false;
  const [salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return timingSafeStringEqual(actual, expected);
}

export function generateTellingPin(): string {
  return String(100_000_000 + crypto.randomInt(900_000_000));
}

export function tellingPinLookup(pin: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(pin).digest("hex");
}
