import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATERING_SETTINGS } from "@tresamigos/utils";

const prisma = new PrismaClient();

async function main() {
  const [orders, applications, newsletter] = await Promise.all([
    prisma.cateringOrder.deleteMany(),
    prisma.application.deleteMany(),
    prisma.promoLead.deleteMany()
  ]);

  const site = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (site) {
    await prisma.siteSettings.update({
      where: { id: "default" },
      data: { cateringCatalog: DEFAULT_CATERING_SETTINGS as object }
    });
  }

  console.log("Testdata verwijderd:");
  console.log(`- ${orders.count} cateringbestellingen`);
  console.log(`- ${applications.count} sollicitaties`);
  console.log(`- ${newsletter.count} nieuwsbrief-inschrijvingen`);
  console.log("Cateringcatalogus gereset naar defaults (incl. drinks/sauces, catering@tresamigos.nl).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
