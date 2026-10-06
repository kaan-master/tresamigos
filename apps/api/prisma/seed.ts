import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_TAB_IDS, type SiteContent } from "@tresamigos/types";
import { sanitizeContent } from "@tresamigos/utils";
import { hashPassword } from "@tresamigos/utils/crypto-node";
import { COUNT_LISTS } from "./countCatalog";

const prisma = new PrismaClient({
  log: process.env.DEBUG_SEED === "1" ? ["query", "warn", "error"] : ["warn", "error"]
});
const ADMIN_EMAIL = "admin@tresamigos.nl";
const ADMIN_NAME = "Beheerder";

function readAdminPassword() {
  try {
    const envPath = resolve(__dirname, "../../../.env");
    const match = readFileSync(envPath, "utf8").match(/^ADMIN_PASSWORD=(.+)$/m);
    return match?.[1]?.trim() || "239br!GHTENGIne";
  } catch {
    return "239br!GHTENGIne";
  }
}

function loadSeedContent(): SiteContent {
  const seedPath = resolve(__dirname, "../../../data/site-content.json");
  const raw = readFileSync(seedPath, "utf8");
  return sanitizeContent(JSON.parse(raw));
}

function logStep(label: string) {
  console.log(`  · ${label}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Keep existing objects; only add keys that are missing (never replace src/content). */
function mergeMissingRecords(existing: unknown, incoming: unknown): unknown {
  if (!isRecord(existing)) return incoming;
  if (!isRecord(incoming)) return existing;
  const out: Record<string, unknown> = { ...existing };
  for (const [key, incomingValue] of Object.entries(incoming)) {
    if (out[key] == null) {
      out[key] = incomingValue;
      continue;
    }
    if (isRecord(out[key]) && isRecord(incomingValue)) {
      out[key] = mergeMissingRecords(out[key], incomingValue);
    }
  }
  return out;
}

async function upsertSite(content: SiteContent) {
  const { site } = content;
  const siteData = {
    seoTitle: site.seo.pages.home.title,
    seoDescription: site.seo.pages.home.description,
    seoMenuTitle: site.seo.pages.menu.title,
    seoMenuDescription: site.seo.pages.menu.description,
    seoImage: site.seo.image,
    seoPages: site.seo.pages as object,
    navCtaLabel: site.navCta.label,
    navCtaUrl: site.navCta.url,
    navigation: site.navigation as object,
    heroEyebrow: site.hero.eyebrow,
    heroTitle: site.hero.title,
    heroIntro: site.hero.intro,
    heroPrimaryLabel: site.hero.primaryLabel,
    heroPrimaryUrl: site.hero.primaryUrl,
    heroSecondaryLabel: site.hero.secondaryLabel,
    heroSecondaryUrl: site.hero.secondaryUrl,
    heroTags: site.hero.tags,
    footerTitle: site.footer.title,
    footerIntro: site.footer.intro,
    footerEmail: site.footer.email,
    footerInstagramUrl: site.footer.instagramUrl,
    footerTiktokUrl: site.footer.tiktokUrl,
    footerCopyright: site.footer.copyright,
    videosEyebrow: site.videosSection.eyebrow,
    videosTitle: site.videosSection.title,
    videosIntro: site.videosSection.intro,
    vacancyRoles: site.vacancy as object,
    openingHours: site.openingHours as object,
    ourStory: site.ourStory as object,
    ourValue: site.ourValue as object,
    reviews: site.reviews as object,
    instagramFeed: site.instagram as object,
    promoPopup: site.promoPopup as object,
    mailRelay: site.mailRelay as object,
    contactForm: site.contactForm as object,
    pageMedia: site.pageMedia as object
  };

  const existing = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!existing) {
    await prisma.siteSettings.create({ data: { id: "default", ...siteData } });
    return;
  }

  // Nooit admin-content terugzetten. Alleen ontbrekende pageMedia-slots toevoegen (nieuwe velden).
  const mergedPageMedia = mergeMissingRecords(existing.pageMedia, site.pageMedia);
  if (JSON.stringify(mergedPageMedia) !== JSON.stringify(existing.pageMedia)) {
    await prisma.siteSettings.update({
      where: { id: "default" },
      data: { pageMedia: mergedPageMedia as object }
    });
    console.log("  · bestaande site behouden; nieuwe pagina-foto slots aangevuld");
  } else {
    console.log("  · bestaande site behouden (geen overwrite)");
  }
}

async function upsertLocations(content: SiteContent) {
  for (const [index, location] of content.locations.entries()) {
    const existing = await prisma.location.findUnique({ where: { id: location.id } });
    if (existing) continue;
    await prisma.location.create({
      data: {
        id: location.id,
        area: location.area,
        name: location.name,
        address: location.address,
        note: location.note,
        code: location.code || String(index + 1).padStart(3, "0"),
        featured: location.featured === true,
        active: location.active !== false,
        sortOrder: index,
        links: location.links.length
          ? {
              create: location.links.map((link, linkIndex) => ({
                label: link.label,
                url: link.url,
                sortOrder: linkIndex
              }))
            }
          : undefined
      }
    });
  }
}

async function upsertVideos(content: SiteContent) {
  for (const [index, video] of content.videos.entries()) {
    const existing = await prisma.video.findUnique({ where: { id: video.id } });
    if (existing) continue;
    await prisma.video.create({
      data: {
        id: video.id,
        title: video.title,
        caption: video.caption,
        src: video.src,
        active: video.active !== false,
        sortOrder: index
      }
    });
  }
}

async function upsertMenu(content: SiteContent) {
  for (const [categoryIndex, category] of content.menu.entries()) {
    const existingCategory = await prisma.menuCategory.findUnique({ where: { id: category.id } });
    if (!existingCategory) {
      await prisma.menuCategory.create({
        data: {
          id: category.id,
          title: category.title,
          orderLabel: category.orderLabel,
          active: category.active !== false,
          sortOrder: categoryIndex
        }
      });
    }

    for (const [itemIndex, item] of category.items.entries()) {
      const existingItem = await prisma.menuItem.findUnique({ where: { id: item.id } });
      if (existingItem) continue;
      await prisma.menuItem.create({
        data: {
          id: item.id,
          categoryId: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || "",
          featured: item.featured === true,
          active: item.active !== false,
          sortOrder: itemIndex
        }
      });
    }
  }
}

async function upsertCountCatalog() {
  for (const [listIndex, list] of COUNT_LISTS.entries()) {
    await prisma.countList.upsert({
      where: { id: list.id },
      create: {
        id: list.id,
        title: list.title,
        active: true,
        sortOrder: listIndex
      },
      update: {
        title: list.title,
        active: true,
        sortOrder: listIndex
      }
    });

    const productIds: string[] = [];
    for (const [categoryIndex, category] of list.categories.entries()) {
      const existingCategory = await prisma.countCategory.findUnique({ where: { id: category.id } });
      if (!existingCategory) {
        await prisma.countCategory.create({
          data: {
            id: category.id,
            name: category.name,
            active: true,
            sortOrder: categoryIndex
          }
        });
      } else if (existingCategory.name !== category.name) {
        await prisma.countCategory.update({
          where: { id: category.id },
          data: { name: category.name, sortOrder: categoryIndex }
        });
      }

      for (const [productIndex, product] of category.products.entries()) {
        productIds.push(product.id);
        const existingProduct = await prisma.countProduct.findUnique({ where: { id: product.id } });
        if (existingProduct) continue;
        await prisma.countProduct.create({
          data: {
            id: product.id,
            categoryId: category.id,
            name: product.name,
            active: true,
            sortOrder: productIndex
          }
        });
      }
    }

    for (const [index, productId] of productIds.entries()) {
      await prisma.countListProduct.upsert({
        where: { listId_productId: { listId: list.id, productId } },
        create: { listId: list.id, productId, sortOrder: index },
        update: { sortOrder: index }
      });
    }
  }
}

async function upsertAdminUser(password: string) {
  const existing = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    await prisma.adminUser.update({
      where: { email: ADMIN_EMAIL },
      data: {
        name: ADMIN_NAME,
        permissions: [...ADMIN_TAB_IDS],
        active: true
      }
    });
    return;
  }
  await prisma.adminUser.create({
    data: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hashPassword(password),
      permissions: [...ADMIN_TAB_IDS],
      active: true
    }
  });
}

async function main() {
  console.log("Seed starten...");
  const content = loadSeedContent();
  const adminPassword = readAdminPassword();

  logStep("site settings");
  await upsertSite(content);
  logStep("locations");
  await upsertLocations(content);
  logStep("videos");
  await upsertVideos(content);
  logStep("menu");
  await upsertMenu(content);
  logStep("admin user");
  await upsertAdminUser(adminPassword);
  logStep("telling catalogus");
  await upsertCountCatalog();

  console.log("Seed completed.");
  console.log(`Admin login: ${ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error("Seed mislukt:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
