import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { hashPassword } from "@tresamigos/utils";

const prisma = new PrismaClient();

function readAdminPassword() {
  try {
    const envPath = resolve(__dirname, "../../../.env");
    const match = readFileSync(envPath, "utf8").match(/^ADMIN_PASSWORD=(.+)$/m);
    return match?.[1]?.trim() || "239br!GHTENGIne";
  } catch {
    return "239br!GHTENGIne";
  }
}

const password = readAdminPassword();

async function main() {
  await prisma.adminUser.update({
    where: { email: "admin@tresamigos.nl" },
    data: { passwordHash: hashPassword(password) }
  });
  console.log("Admin password updated for admin@tresamigos.nl");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
