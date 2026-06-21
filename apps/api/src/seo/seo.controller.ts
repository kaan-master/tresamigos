import { Controller, Get, Header } from "@nestjs/common";
import { SEO_PAGE_KEYS } from "@tresamigos/types";
import { ContentService } from "../content/content.service";

const SEO_PATHS: Record<(typeof SEO_PAGE_KEYS)[number], string> = {
  home: "/",
  menu: "/menu",
  locations: "/locations",
  order: "/order",
  contact: "/contact",
  ourStory: "/our-story",
  ourValue: "/our-value",
  vacancy: "/vacancy"
};

@Controller()
export class SeoController {
  constructor(private readonly contentService: ContentService) {}

  @Get("robots.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  async robots() {
    const content = await this.contentService.getContent();
    const siteUrl = content.site.seo.siteUrl.replace(/\/$/, "");
    return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  }

  @Get("sitemap.xml")
  @Header("Content-Type", "application/xml; charset=utf-8")
  async sitemap() {
    const content = await this.contentService.getContent();
    const siteUrl = content.site.seo.siteUrl.replace(/\/$/, "");
    const now = new Date().toISOString();

    const urls = SEO_PAGE_KEYS.filter((key) => !content.site.seo.pages[key]?.noindex).map((key) => {
      const path = SEO_PATHS[key];
      const loc = `${siteUrl}${path === "/" ? "" : path}`;
      return `<url><loc>${loc}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${key === "home" ? "1.0" : "0.8"}</priority></url>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  }
}
