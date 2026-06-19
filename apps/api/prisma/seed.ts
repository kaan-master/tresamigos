import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SiteContent } from "@tresamigos/types";
import { sanitizeContent } from "@tresamigos/utils";

const prisma = new PrismaClient();

function loadSeedContent(): SiteContent {
  const seedPath = resolve(__dirname, "../../../data/site-content.json");
  const raw = readFileSync(seedPath, "utf8");
  return sanitizeContent(JSON.parse(raw));
}

async function upsertSite(content: SiteContent) {
  const { site } = content;
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      seoTitle: site.seo.pages.home.title,
      seoDescription: site.seo.pages.home.description,
      seoMenuTitle: site.seo.pages.menu.title,
      seoMenuDescription: site.seo.pages.menu.description,
      seoImage: site.seo.image,
      seoPages: site.seo.pages,
      navCtaLabel: site.navCta.label,
      navCtaUrl: site.navCta.url,
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
      reviews: site.reviews as object,
      instagramFeed: site.instagram as object,
      promoPopup: site.promoPopup as object,
      mailRelay: site.mailRelay as object,
      contactForm: site.contactForm as object
    },
    update: {
      seoTitle: site.seo.pages.home.title,
      seoDescription: site.seo.pages.home.description,
      seoMenuTitle: site.seo.pages.menu.title,
      seoMenuDescription: site.seo.pages.menu.description,
      seoImage: site.seo.image,
      seoPages: site.seo.pages,
      navCtaLabel: site.navCta.label,
      navCtaUrl: site.navCta.url,
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
      reviews: site.reviews as object,
      instagramFeed: site.instagram as object,
      promoPopup: site.promoPopup as object,
      mailRelay: site.mailRelay as object,
      contactForm: site.contactForm as object
    }
  });
}

async function upsertLocations(content: SiteContent) {
  await prisma.orderLink.deleteMany();
  await prisma.location.deleteMany();

  for (const [index, location] of content.locations.entries()) {
    await prisma.location.create({
      data: {
        id: location.id,
        area: location.area,
        name: location.name,
        address: location.address,
        note: location.note,
        featured: location.featured === true,
        active: location.active !== false,
        sortOrder: index,
        links: {
          create: location.links.map((link, linkIndex) => ({
            label: link.label,
            url: link.url,
            sortOrder: linkIndex
          }))
        }
      }
    });
  }
}

async function upsertVideos(content: SiteContent) {
  await prisma.video.deleteMany();

  for (const [index, video] of content.videos.entries()) {
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
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  for (const [categoryIndex, category] of content.menu.entries()) {
    await prisma.menuCategory.create({
      data: {
        id: category.id,
        title: category.title,
        orderLabel: category.orderLabel,
        active: category.active !== false,
        sortOrder: categoryIndex,
        items: {
          create: category.items.map((item, itemIndex) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            featured: item.featured === true,
            active: item.active !== false,
            sortOrder: itemIndex
          }))
        }
      }
    });
  }
}

async function main() {
  const content = loadSeedContent();
  await upsertSite(content);
  await upsertLocations(content);
  await upsertVideos(content);
  await upsertMenu(content);
  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
