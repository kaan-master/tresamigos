import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATERING_SETTINGS } from "@tresamigos/utils";

async function main() {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "default" } });
    const current =
      row?.cateringCatalog && typeof row.cateringCatalog === "object" && !Array.isArray(row.cateringCatalog)
        ? (row.cateringCatalog as Record<string, unknown>)
        : {};

    const next = {
      ...DEFAULT_CATERING_SETTINGS,
      notifications: (current.notifications as typeof DEFAULT_CATERING_SETTINGS.notifications) || DEFAULT_CATERING_SETTINGS.notifications,
      fulfillment: (current.fulfillment as typeof DEFAULT_CATERING_SETTINGS.fulfillment) || DEFAULT_CATERING_SETTINGS.fulfillment,
      maxOnlineServings:
        (current.maxOnlineServings as number | undefined) || DEFAULT_CATERING_SETTINGS.maxOnlineServings,
      largeGroupEmail: (current.largeGroupEmail as string | undefined) || DEFAULT_CATERING_SETTINGS.largeGroupEmail
    };

    await prisma.siteSettings.update({
      where: { id: "default" },
      data: { cateringCatalog: next }
    });

    const burrito = next.products.filter((p) => p.categoryId === "burritos");
    const drinks = next.products.filter((p) => p.categoryId === "drinks");
    console.log(
      JSON.stringify(
        {
          categories: next.categories.map((c) => c.id),
          totals: {
            products: next.products.length,
            burritos: burrito.length,
            drinks: drinks.length,
            active: next.products.filter((p) => p.active).length
          },
          sampleBurritos: burrito.map((p) => ({
            id: p.id,
            name: p.name.en,
            image: p.image,
            price: p.basePriceCents,
            active: p.active
          }))
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
