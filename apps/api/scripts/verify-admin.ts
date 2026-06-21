import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "@tresamigos/utils";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.adminUser.findUnique({ where: { email: "admin@tresamigos.nl" } });
  if (!user) {
    console.error("Admin user not found");
    process.exit(1);
  }
  const ok = verifyPassword("239br!GHTENGIne", user.passwordHash);
  console.log(`Admin: ${user.email}, permissions: ${user.permissions.length}, password ok: ${ok}`);
  if (!ok) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
