import crypto from "node:crypto";
import type {
  Application,
  ApplicationRole,
  CreateApplicationInput,
  SiteContent,
  WeekDay
} from "@tresamigos/types";
import { APPLICATION_ROLES, WEEK_DAYS } from "@tresamigos/types";

export function cleanText(value: unknown, fallback = "", max = 1000): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

export function cleanUrl(value: unknown): string {
  const url = cleanText(value, "", 2000);
  if (!url) return "";
  const allowed = [
    "http://",
    "https://",
    "mailto:",
    "/",
    "index.html",
    "menu.html",
    "locations.html",
    "order.html",
    "contact.html",
    "our-story.html",
    "vacancy.html",
    "#"
  ];
  if (allowed.some((prefix) => url.startsWith(prefix))) return url;
  if (url.startsWith("assets/")) return url;
  return "";
}

export function cleanSlug(value: unknown, fallback: string): string {
  return (
    cleanText(value, fallback, 80)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

export function cleanPrice(value: unknown): string {
  const price = cleanText(value, "", 40).replace(/^\?/, "€");
  if (!price) return "";
  return price.startsWith("€") ? price : `€${price}`;
}

export function cleanList(value: unknown, allowed: readonly string[], max = 20): string[] {
  if (!Array.isArray(value)) return [];
  const allowedSet = new Set(allowed);
  return value
    .map((item) => cleanText(item, "", 80))
    .filter((item): item is string => allowedSet.has(item))
    .slice(0, max);
}

export function sanitizeApplication(input: CreateApplicationInput | Application): Application {
  const pdf = input?.pdf && typeof input.pdf === "object" ? input.pdf : null;
  const pdfName = cleanText(pdf?.name, "", 180);
  const pdfData = cleanText(pdf?.data, "", 6_000_000);

  return {
    id: cleanText(input?.id, crypto.randomUUID(), 80),
    createdAt: cleanText(input?.createdAt, new Date().toISOString(), 80),
    status: cleanText(input?.status, "nieuw", 40),
    role: (APPLICATION_ROLES.includes(input?.role as ApplicationRole)
      ? input.role
      : APPLICATION_ROLES[0]) as ApplicationRole,
    name: cleanText(input?.name, "", 160),
    email: cleanText(input?.email, "", 180),
    phone: cleanText(input?.phone, "", 80),
    days: cleanList(input?.days, WEEK_DAYS, 7) as WeekDay[],
    availabilityNote: cleanText(input?.availabilityNote, "", 1000),
    experience: cleanText(input?.experience, "", 1600),
    motivation: cleanText(input?.motivation, "", 1600),
    pdf:
      pdfName && pdfData.startsWith("data:application/pdf;base64,")
        ? {
            name: pdfName,
            size: Number(pdf?.size || 0),
            data: pdfData
          }
        : null
  };
}

export function sanitizeContent(input: unknown): SiteContent {
  const payload = input && typeof input === "object" ? (input as Partial<SiteContent>) : {};
  const site = payload.site || ({} as SiteContent["site"]);
  const seo = site.seo || ({} as SiteContent["site"]["seo"]);
  const hero = site.hero || ({} as SiteContent["site"]["hero"]);
  const footer = site.footer || ({} as SiteContent["site"]["footer"]);
  const navCta = site.navCta || ({} as SiteContent["site"]["navCta"]);
  const videosSection = site.videosSection || ({} as SiteContent["site"]["videosSection"]);

  const locations = Array.isArray(payload.locations)
    ? payload.locations.slice(0, 50).map((location, index) => {
        const name = cleanText(location.name, `Vestiging ${index + 1}`, 120);
        const links = Array.isArray(location.links)
          ? location.links
              .slice(0, 12)
              .map((link) => ({
                label: cleanText(link.label, "Bestellen", 80),
                url: cleanUrl(link.url)
              }))
              .filter((link) => link.label && link.url)
          : [];

        return {
          id: cleanSlug(location.id, cleanSlug(name, `vestiging-${index + 1}`)),
          area: cleanText(location.area, "Amsterdam", 120),
          name,
          address: cleanText(location.address, "", 240),
          note: cleanText(location.note, "Take away and delivery options", 240),
          featured: location.featured === true,
          active: location.active !== false,
          links
        };
      })
    : [];

  const videos = Array.isArray(payload.videos)
    ? payload.videos
        .slice(0, 12)
        .map((video, index) => {
          const title = cleanText(video.title, `Video ${index + 1}`, 120);
          return {
            id: cleanSlug(video.id, cleanSlug(title, `video-${index + 1}`)),
            title,
            caption: cleanText(video.caption, "", 240),
            src: cleanUrl(video.src),
            active: video.active !== false
          };
        })
        .filter((video) => video.src)
    : [];

  const menu = Array.isArray(payload.menu)
    ? payload.menu.slice(0, 40).map((category, categoryIndex) => {
        const title = cleanText(category.title, `Categorie ${categoryIndex + 1}`, 120);
        const items = Array.isArray(category.items)
          ? category.items.slice(0, 80).map((item, itemIndex) => {
              const name = cleanText(item.name, `Menu item ${itemIndex + 1}`, 160);
              return {
                id: cleanSlug(item.id, cleanSlug(name, `item-${categoryIndex + 1}-${itemIndex + 1}`)),
                name,
                description: cleanText(item.description, "", 420),
                price: cleanPrice(item.price),
                featured: item.featured === true,
                active: item.active !== false
              };
            })
          : [];

        return {
          id: cleanSlug(category.id, cleanSlug(title, `categorie-${categoryIndex + 1}`)),
          title,
          orderLabel: cleanText(category.orderLabel, `Order ${title}`, 90),
          active: category.active !== false,
          items
        };
      })
    : [];

  return {
    site: {
      seo: {
        title: cleanText(seo.title, "Tres Amigos | Mexican Street Food Amsterdam", 180),
        description: cleanText(
          seo.description,
          "Tres Amigos Amsterdam. Mexican street food, tacos, burritos, bowls and order links for every location.",
          300
        ),
        menuTitle: cleanText(seo.menuTitle, "Menu | Tres Amigos", 180),
        menuDescription: cleanText(
          seo.menuDescription,
          "Bekijk het Tres Amigos menu met tacos, burritos, quesadillas, bowls, sides en desserts.",
          300
        ),
        image: cleanUrl(seo.image)
      },
      navCta: {
        label: cleanText(navCta.label, "Order Now", 80),
        url: cleanUrl(navCta.url) || "/order"
      },
      hero: {
        eyebrow: cleanText(hero.eyebrow, "Amsterdam Mexican Street Food", 120),
        title: cleanText(hero.title, "Fresh Mexican street food.", 180),
        intro: cleanText(hero.intro, "", 500),
        primaryLabel: cleanText(hero.primaryLabel, "Order now", 80),
        primaryUrl: cleanUrl(hero.primaryUrl) || "/order",
        secondaryLabel: cleanText(hero.secondaryLabel, "View menu", 80),
        secondaryUrl: cleanUrl(hero.secondaryUrl) || "/menu",
        tags: Array.isArray(hero.tags)
          ? hero.tags.map((tag) => cleanText(tag, "", 40)).filter(Boolean).slice(0, 10)
          : []
      },
      footer: {
        title: cleanText(footer.title, "Eat like a Mexican", 120),
        intro: cleanText(footer.intro, "", 500),
        email: cleanText(footer.email, "", 180),
        instagramUrl: cleanUrl(footer.instagramUrl),
        tiktokUrl: cleanUrl(footer.tiktokUrl),
        copyright: cleanText(footer.copyright, "© 2026 Tres Amigos.", 160)
      },
      videosSection: {
        eyebrow: cleanText(videosSection.eyebrow, "Sfeer", 80),
        title: cleanText(videosSection.title, "Street food in beweging.", 160),
        intro: cleanText(videosSection.intro, "", 500)
      }
    },
    videos,
    menu,
    locations
  };
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function passwordMatches(password: string, env: NodeJS.ProcessEnv): boolean {
  const hashConfig = env.ADMIN_PASSWORD_HASH || "";
  const passwordConfig = env.ADMIN_PASSWORD || "";

  if (hashConfig.includes(":")) {
    const [salt, expected] = hashConfig.split(":");
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");
    return timingSafeStringEqual(actual, expected);
  }

  if (passwordConfig) return timingSafeStringEqual(password, passwordConfig);
  return false;
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
