import { Injectable } from "@nestjs/common";
import type { SiteContent } from "@tresamigos/types";
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
          image: site.seoImage
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
        }
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
          seoTitle: content.site.seo.title,
          seoDescription: content.site.seo.description,
          seoMenuTitle: content.site.seo.menuTitle,
          seoMenuDescription: content.site.seo.menuDescription,
          seoImage: content.site.seo.image,
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
          videosIntro: content.site.videosSection.intro
        },
        update: {
          seoTitle: content.site.seo.title,
          seoDescription: content.site.seo.description,
          seoMenuTitle: content.site.seo.menuTitle,
          seoMenuDescription: content.site.seo.menuDescription,
          seoImage: content.site.seo.image,
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
          videosIntro: content.site.videosSection.intro
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
              create: location.links.map((link, linkIndex) => ({
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
    });

    return this.getContent();
  }
}
