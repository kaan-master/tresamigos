import { existsSync } from "node:fs";
import { join } from "node:path";

function resolveRepoRoot() {
  let current = __dirname;
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(join(current, "data", "site-content.json"))) {
      return current;
    }
    const parent = join(current, "..");
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Kon repo-root niet vinden (site-content.json ontbreekt).");
}

export const REPO_ROOT = resolveRepoRoot();
export const ASSETS_ROOT = join(REPO_ROOT, "assets");
export const PUBLIC_ASSETS_ROOT = join(REPO_ROOT, "apps", "web", "public", "assets");
export const UPLOADS_DIR = join(ASSETS_ROOT, "uploads");
