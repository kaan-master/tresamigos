/**
 * Sync cateringCatalog in DB with DEFAULT_CATERING_SETTINGS (products + ingredients).
 * Usage: npx tsx apps/api/scripts/sync-catering-catalog.ts
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATERING_SETTINGS, sanitizeCateringSettings } from "@tresamigos/utils";

const prisma = new PrismaClient();

async function main() {
  const site = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const current = sanitizeCateringSettings(site?.cateringCatalog ?? {});
  const next = sanitizeCateringSettings({
    ...current,
    products: DEFAULT_CATERING_SETTINGS.products,
    ingredients: DEFAULT_CATERING_SETTINGS.ingredients,
    categories: DEFAULT_CATERING_SETTINGS.categories,
    largeGroupEmail: DEFAULT_CATERING_SETTINGS.largeGroupEmail,
    maxOnlineServings: DEFAULT_CATERING_SETTINGS.maxOnlineServings
  });

  await prisma.siteSettings.update({
    where: { id: "default" },
    data: { cateringCatalog: next as object }
  });

  const drinks = next.products.filter((p) => p.categoryId === "drinks").length;
  const sauces = next.products.filter((p) => p.categoryId === "sauces").length;
  console.log(`Catering catalog synced. Products: ${next.products.length} (drinks ${drinks}, sauces ${sauces}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
