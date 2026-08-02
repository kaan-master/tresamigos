import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ADMIN_TAB_IDS, type SiteContent } from "@tresamigos/types";
import { hashPassword, sanitizeContent } from "@tresamigos/utils";

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
    contactForm: site.contactForm as object
  };

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...siteData },
    update: siteData
  });
}

async function upsertLocations(content: SiteContent) {
  const keepIds = content.locations.map((location) => location.id);

  for (const [index, location] of content.locations.entries()) {
    await prisma.location.upsert({
      where: { id: location.id },
      create: {
        id: location.id,
        area: location.area,
        name: location.name,
        address: location.address,
        note: location.note,
        featured: location.featured === true,
        active: location.active !== false,
        sortOrder: index
      },
      update: {
        area: location.area,
        name: location.name,
        address: location.address,
        note: location.note,
        featured: location.featured === true,
        active: location.active !== false,
        sortOrder: index
      }
    });

    await prisma.orderLink.deleteMany({ where: { locationId: location.id } });
    if (location.links.length) {
      await prisma.orderLink.createMany({
        data: location.links.map((link, linkIndex) => ({
          locationId: location.id,
          label: link.label,
          url: link.url,
          sortOrder: linkIndex
        }))
      });
    }
  }

  if (keepIds.length) {
    await prisma.orderLink.deleteMany({ where: { locationId: { notIn: keepIds } } });
    await prisma.location.deleteMany({ where: { id: { notIn: keepIds } } });
  }
}

async function upsertVideos(content: SiteContent) {
  const keepIds = content.videos.map((video) => video.id);

  for (const [index, video] of content.videos.entries()) {
    await prisma.video.upsert({
      where: { id: video.id },
      create: {
        id: video.id,
        title: video.title,
        caption: video.caption,
        src: video.src,
        active: video.active !== false,
        sortOrder: index
      },
      update: {
        title: video.title,
        caption: video.caption,
        src: video.src,
        active: video.active !== false,
        sortOrder: index
      }
    });
  }

  if (keepIds.length) {
    await prisma.video.deleteMany({ where: { id: { notIn: keepIds } } });
  }
}

async function upsertMenu(content: SiteContent) {
  const keepCategoryIds = content.menu.map((category) => category.id);
  const keepItemIds = content.menu.flatMap((category) => category.items.map((item) => item.id));

  for (const [categoryIndex, category] of content.menu.entries()) {
    await prisma.menuCategory.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        title: category.title,
        orderLabel: category.orderLabel,
        active: category.active !== false,
        sortOrder: categoryIndex
      },
      update: {
        title: category.title,
        orderLabel: category.orderLabel,
        active: category.active !== false,
        sortOrder: categoryIndex
      }
    });

    for (const [itemIndex, item] of category.items.entries()) {
      await prisma.menuItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          categoryId: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || "",
          featured: item.featured === true,
          active: item.active !== false,
          sortOrder: itemIndex
        },
        update: {
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

  if (keepItemIds.length) {
    await prisma.menuItem.deleteMany({ where: { id: { notIn: keepItemIds } } });
  }
  if (keepCategoryIds.length) {
    await prisma.menuCategory.deleteMany({ where: { id: { notIn: keepCategoryIds } } });
  }
}

async function upsertAdminUser(password: string) {
  await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hashPassword(password),
      permissions: [...ADMIN_TAB_IDS],
      active: true
    },
    update: {
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
