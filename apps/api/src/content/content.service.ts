import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { MenuItem, OrderLink, PageSeo, SeoPageKey, SiteContent } from "@tresamigos/types";
import { sanitizeContent } from "@tresamigos/utils";
import { PrismaService } from "../prisma/prisma.module";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getContent(): Promise<SiteContent> {
    const [site, locations, videos, menuCategories] = await Promise.all([
      this.prisma.siteSettings.findUniqueOrThrow({ where: { id: "default" } }),
      this.prisma.location.findMany({
        orderBy: { sortOrder: "asc" },
        include: { links: { orderBy: { sortOrder: "asc" } } }
      }),
      this.prisma.video.findMany({ orderBy: { sortOrder: "asc" } }),
      this.prisma.menuCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" } } }
      })
    ]);

    return sanitizeContent({
      site: {
        seo: {
          title: site.seoTitle,
          description: site.seoDescription,
          menuTitle: site.seoMenuTitle,
          menuDescription: site.seoMenuDescription,
          image: site.seoImage,
          siteUrl: site.seoSiteUrl,
          googleSiteVerification: site.seoGoogleVerification,
          bingSiteVerification: site.seoBingVerification,
          pages:
            site.seoPages && typeof site.seoPages === "object" && !Array.isArray(site.seoPages)
              ? (site.seoPages as unknown as Partial<Record<SeoPageKey, PageSeo>>)
              : undefined
        },
        navCta: {
          label: site.navCtaLabel,
          url: site.navCtaUrl
        },
        hero: {
          eyebrow: site.heroEyebrow,
          title: site.heroTitle,
          intro: site.heroIntro,
          primaryLabel: site.heroPrimaryLabel,
          primaryUrl: site.heroPrimaryUrl,
          secondaryLabel: site.heroSecondaryLabel,
          secondaryUrl: site.heroSecondaryUrl,
          tags: site.heroTags
        },
        footer: {
          title: site.footerTitle,
          intro: site.footerIntro,
          email: site.footerEmail,
          instagramUrl: site.footerInstagramUrl,
          tiktokUrl: site.footerTiktokUrl,
          copyright: site.footerCopyright
        },
        videosSection: {
          eyebrow: site.videosEyebrow,
          title: site.videosTitle,
          intro: site.videosIntro
        },
        vacancy:
          site.vacancyRoles && typeof site.vacancyRoles === "object" && !Array.isArray(site.vacancyRoles)
            ? (site.vacancyRoles as unknown as SiteContent["site"]["vacancy"])
            : undefined,
        openingHours:
          site.openingHours && typeof site.openingHours === "object" && !Array.isArray(site.openingHours)
            ? (site.openingHours as unknown as SiteContent["site"]["openingHours"])
            : undefined,
        ourStory:
          site.ourStory && typeof site.ourStory === "object" && !Array.isArray(site.ourStory)
            ? (site.ourStory as unknown as SiteContent["site"]["ourStory"])
            : undefined,
        ourValue:
          site.ourValue && typeof site.ourValue === "object" && !Array.isArray(site.ourValue)
            ? (site.ourValue as unknown as SiteContent["site"]["ourValue"])
            : undefined,
        reviews:
          site.reviews && typeof site.reviews === "object" && !Array.isArray(site.reviews)
            ? (site.reviews as unknown as SiteContent["site"]["reviews"])
            : undefined,
        instagram:
          site.instagramFeed && typeof site.instagramFeed === "object" && !Array.isArray(site.instagramFeed)
            ? (site.instagramFeed as unknown as SiteContent["site"]["instagram"])
            : undefined,
        promoPopup:
          site.promoPopup && typeof site.promoPopup === "object" && !Array.isArray(site.promoPopup)
            ? (site.promoPopup as unknown as SiteContent["site"]["promoPopup"])
            : undefined,
        mailRelay:
          site.mailRelay && typeof site.mailRelay === "object" && !Array.isArray(site.mailRelay)
            ? (site.mailRelay as unknown as SiteContent["site"]["mailRelay"])
            : undefined,
        contactForm:
          site.contactForm && typeof site.contactForm === "object" && !Array.isArray(site.contactForm)
            ? (site.contactForm as unknown as SiteContent["site"]["contactForm"])
            : undefined
      },
      locations: locations.map((location) => ({
        id: location.id,
        area: location.area,
        name: location.name,
        address: location.address,
        note: location.note,
        featured: location.featured,
        active: location.active,
        links: location.links.map((link) => ({ label: link.label, url: link.url }))
      })),
      videos: videos.map((video) => ({
        id: video.id,
        title: video.title,
        caption: video.caption,
        src: video.src,
        active: video.active
      })),
      menu: menuCategories.map((category) => ({
        id: category.id,
        title: category.title,
        orderLabel: category.orderLabel,
        active: category.active,
        items: category.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || undefined,
          featured: item.featured,
          active: item.active
        }))
      }))
    });
  }

  async saveContent(input: unknown): Promise<SiteContent> {
    const content = sanitizeContent(input);

    await this.prisma.$transaction(async (tx) => {
      await tx.siteSettings.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          seoTitle: content.site.seo.pages.home.title,
          seoDescription: content.site.seo.pages.home.description,
          seoMenuTitle: content.site.seo.pages.menu.title,
          seoMenuDescription: content.site.seo.pages.menu.description,
          seoImage: content.site.seo.image,
          seoSiteUrl: content.site.seo.siteUrl,
          seoGoogleVerification: content.site.seo.googleSiteVerification,
          seoBingVerification: content.site.seo.bingSiteVerification,
          seoPages: content.site.seo.pages as unknown as Prisma.InputJsonValue,
          navCtaLabel: content.site.navCta.label,
          navCtaUrl: content.site.navCta.url,
          heroEyebrow: content.site.hero.eyebrow,
          heroTitle: content.site.hero.title,
          heroIntro: content.site.hero.intro,
          heroPrimaryLabel: content.site.hero.primaryLabel,
          heroPrimaryUrl: content.site.hero.primaryUrl,
          heroSecondaryLabel: content.site.hero.secondaryLabel,
          heroSecondaryUrl: content.site.hero.secondaryUrl,
          heroTags: content.site.hero.tags,
          footerTitle: content.site.footer.title,
          footerIntro: content.site.footer.intro,
          footerEmail: content.site.footer.email,
          footerInstagramUrl: content.site.footer.instagramUrl,
          footerTiktokUrl: content.site.footer.tiktokUrl,
          footerCopyright: content.site.footer.copyright,
          videosEyebrow: content.site.videosSection.eyebrow,
          videosTitle: content.site.videosSection.title,
          videosIntro: content.site.videosSection.intro,
          vacancyRoles: content.site.vacancy as unknown as Prisma.InputJsonValue,
          openingHours: content.site.openingHours as unknown as Prisma.InputJsonValue,
          ourStory: content.site.ourStory as unknown as Prisma.InputJsonValue,
          ourValue: content.site.ourValue as unknown as Prisma.InputJsonValue,
          reviews: content.site.reviews as unknown as Prisma.InputJsonValue,
          instagramFeed: content.site.instagram as unknown as Prisma.InputJsonValue,
          promoPopup: content.site.promoPopup as unknown as Prisma.InputJsonValue,
          mailRelay: content.site.mailRelay as unknown as Prisma.InputJsonValue,
          contactForm: content.site.contactForm as unknown as Prisma.InputJsonValue
        },
        update: {
          seoTitle: content.site.seo.pages.home.title,
          seoDescription: content.site.seo.pages.home.description,
          seoMenuTitle: content.site.seo.pages.menu.title,
          seoMenuDescription: content.site.seo.pages.menu.description,
          seoImage: content.site.seo.image,
          seoSiteUrl: content.site.seo.siteUrl,
          seoGoogleVerification: content.site.seo.googleSiteVerification,
          seoBingVerification: content.site.seo.bingSiteVerification,
          seoPages: content.site.seo.pages as unknown as Prisma.InputJsonValue,
          navCtaLabel: content.site.navCta.label,
          navCtaUrl: content.site.navCta.url,
          heroEyebrow: content.site.hero.eyebrow,
          heroTitle: content.site.hero.title,
          heroIntro: content.site.hero.intro,
          heroPrimaryLabel: content.site.hero.primaryLabel,
          heroPrimaryUrl: content.site.hero.primaryUrl,
          heroSecondaryLabel: content.site.hero.secondaryLabel,
          heroSecondaryUrl: content.site.hero.secondaryUrl,
          heroTags: content.site.hero.tags,
          footerTitle: content.site.footer.title,
          footerIntro: content.site.footer.intro,
          footerEmail: content.site.footer.email,
          footerInstagramUrl: content.site.footer.instagramUrl,
          footerTiktokUrl: content.site.footer.tiktokUrl,
          footerCopyright: content.site.footer.copyright,
          videosEyebrow: content.site.videosSection.eyebrow,
          videosTitle: content.site.videosSection.title,
          videosIntro: content.site.videosSection.intro,
          vacancyRoles: content.site.vacancy as unknown as Prisma.InputJsonValue,
          openingHours: content.site.openingHours as unknown as Prisma.InputJsonValue,
          ourStory: content.site.ourStory as unknown as Prisma.InputJsonValue,
          ourValue: content.site.ourValue as unknown as Prisma.InputJsonValue,
          reviews: content.site.reviews as unknown as Prisma.InputJsonValue,
          instagramFeed: content.site.instagram as unknown as Prisma.InputJsonValue,
          promoPopup: content.site.promoPopup as unknown as Prisma.InputJsonValue,
          mailRelay: content.site.mailRelay as unknown as Prisma.InputJsonValue,
          contactForm: content.site.contactForm as unknown as Prisma.InputJsonValue
        }
      });

      await tx.orderLink.deleteMany();
      await tx.location.deleteMany();
      for (const [index, location] of content.locations.entries()) {
        await tx.location.create({
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
              create: location.links.map((link: OrderLink, linkIndex: number) => ({
                label: link.label,
                url: link.url,
                sortOrder: linkIndex
              }))
            }
          }
        });
      }

      await tx.video.deleteMany();
      for (const [index, video] of content.videos.entries()) {
        await tx.video.create({
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

      await tx.menuItem.deleteMany();
      await tx.menuCategory.deleteMany();
      for (const [categoryIndex, category] of content.menu.entries()) {
        await tx.menuCategory.create({
          data: {
            id: category.id,
            title: category.title,
            orderLabel: category.orderLabel,
            active: category.active !== false,
            sortOrder: categoryIndex,
            items: {
              create: category.items.map((item: MenuItem, itemIndex: number) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image || "",
                featured: item.featured === true,
                active: item.active !== false,
                sortOrder: itemIndex
              }))
            }
          }
        });
      }
    });

    return this.getContent();
  }
}
