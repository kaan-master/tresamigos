import crypto from "node:crypto";
import type {
  Application,
  CreateApplicationInput,
  PageSeo,
  SeoPageKey,
  SiteContent,
  VacancyRoleConfig,
  WeekDay
} from "@tresamigos/types";
import { SEO_PAGE_KEYS, WEEK_DAYS } from "@tresamigos/types";

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

const DEFAULT_VACANCY_JOBS: SiteContent["site"]["vacancy"]["jobs"] = [
  {
    id: "preparation-chef",
    enabled: true,
    title: "Preparation Chef",
    summary:
      "As a Preparation Chef, you will be responsible for efficiently and effectively preparing all ingredients and components required for the daily operations of the Mexican restaurant.",
    requirements: [
      "Excellent customer service skills with a friendly and helpful attitude.",
      "Ability to work efficiently in a fast-paced environment and under pressure.",
      "Accuracy and attention to detail when handling orders and preparing dishes."
    ],
    fullDescription:
      "As a Preparation Chef, you will be responsible for efficiently and effectively preparing all ingredients and components required for the daily operations of the Mexican restaurant. You keep prep stations stocked, maintain quality standards and support the line during peak hours.",
    applyLabel: "Apply here",
    image: "assets/site/restaurant-interior.jpg"
  },
  {
    id: "kitchen-employee",
    enabled: true,
    title: "Kitchen Employee",
    summary:
      "As a member of the kitchen crew, you will be responsible for various tasks that contribute to the smooth operation of the takeaway service and ensure a great experience for our customers.",
    requirements: [
      "Ability to work efficiently in a fast-paced environment and under time constraints.",
      "Accuracy and attention to detail in order processing and food preparation.",
      "Basic knowledge of Mexican cuisine and dishes is a plus."
    ],
    fullDescription:
      "As a member of the kitchen crew, you will be responsible for various tasks that contribute to the smooth operation of the takeaway service and ensure a great experience for our customers. From assembly to packaging, you help keep orders moving fast and fresh.",
    applyLabel: "Apply here",
    image: "assets/brand/home-card.png"
  },
  {
    id: "shift-leader",
    enabled: true,
    title: "Shift Leader",
    summary:
      "You are responsible for coordinating and managing daily operational activities during your shift at Tres Amigos. You act as the link between management and staff.",
    requirements: [
      "Lead and motivate staff to prep orders quickly and efficiently.",
      "Give clear instructions and guide the team. You're in charge!",
      "Oversee all restaurant operations: reception, service, kitchen, checkout, and couriers."
    ],
    fullDescription:
      "You are responsible for coordinating and managing daily operational activities during your shift at Tres Amigos. You act as the link between management and staff, keep service smooth and step in when the pace picks up.",
    applyLabel: "Apply here",
    image: "assets/site/quesadilla-drinks.webp"
  },
  {
    id: "branch-manager",
    enabled: true,
    title: "Branch Manager",
    summary:
      "As the Manager of Tres Amigos, you will be responsible for effectively leading the team and overseeing all operational aspects of the takeaway service.",
    requirements: [
      "Manage orders, inventory, scheduling, and customer service.",
      "Keep operations running smoothly and up to standards.",
      "Hire, train, and coach staff for top performance.",
      "Schedule shifts, assign tasks, and track team results."
    ],
    fullDescription:
      "As the Manager of Tres Amigos, you will be responsible for effectively leading the team and overseeing all operational aspects of the takeaway service. You set the tone, protect quality and build a crew people want to work with.",
    applyLabel: "Apply here",
    image: "assets/brand/eat-like-a-mexican.png"
  }
];

const DEFAULT_VACANCY: SiteContent["site"]["vacancy"] = {
  heroTitle: "Join the crew",
  heroIntro: "Build your career at Tres Amigos. Choose a role, read the full description and apply in a few simple steps.",
  heroImage: "assets/site/restaurant-interior.jpg",
  formImage: "assets/brand/home-card.png",
  jobs: DEFAULT_VACANCY_JOBS
};

function sanitizeVacancySettings(vacancy: SiteContent["site"]["vacancy"] | undefined) {
  const raw = vacancy || DEFAULT_VACANCY;

  const legacyRoles =
    raw && typeof raw === "object" && "roles" in raw && raw.roles && typeof raw.roles === "object"
      ? (raw.roles as Record<string, VacancyRoleConfig>)
      : null;

  const rawJobs = Array.isArray(raw.jobs)
    ? raw.jobs
    : legacyRoles
      ? Object.entries(legacyRoles).map(([key, config], index) => ({
          id: cleanSlug(key, `job-${index + 1}`),
          enabled: config.enabled !== false,
          title: config.title,
          summary: config.copy,
          requirements: [] as string[],
          fullDescription: config.copy,
          applyLabel: "Apply here",
          image: ""
        }))
      : DEFAULT_VACANCY_JOBS;

  const jobs = rawJobs.slice(0, 20).map((job, index) => {
    const title = cleanText(job?.title, DEFAULT_VACANCY_JOBS[index]?.title || `Role ${index + 1}`, 160);
    const requirements = Array.isArray(job?.requirements)
      ? job.requirements.map((item) => cleanText(item, "", 240)).filter(Boolean).slice(0, 12)
      : DEFAULT_VACANCY_JOBS[index]?.requirements || [];

    return {
      id: cleanSlug(job?.id, cleanSlug(title, `job-${index + 1}`)),
      enabled: job?.enabled !== false,
      title,
      summary: cleanText(job?.summary, DEFAULT_VACANCY_JOBS[index]?.summary || "", 800),
      requirements,
      fullDescription: cleanText(job?.fullDescription, DEFAULT_VACANCY_JOBS[index]?.fullDescription || "", 2000),
      applyLabel: cleanText(job?.applyLabel, "Apply here", 80),
      image: cleanUrl(job?.image) || DEFAULT_VACANCY_JOBS[index]?.image || DEFAULT_VACANCY.heroImage
    };
  });

  return {
    heroTitle: cleanText(raw.heroTitle, DEFAULT_VACANCY.heroTitle, 160),
    heroIntro: cleanText(raw.heroIntro, DEFAULT_VACANCY.heroIntro, 600),
    heroImage: cleanUrl(raw.heroImage) || DEFAULT_VACANCY.heroImage,
    formImage: cleanUrl(raw.formImage) || DEFAULT_VACANCY.formImage,
    jobs: jobs.length ? jobs : DEFAULT_VACANCY_JOBS
  };
}

const DEFAULT_OPENING_HOURS: SiteContent["site"]["openingHours"] = {
  enabled: true,
  eyebrow: "Take away!",
  title: "Order now",
  sectionLabel: "Open Hours",
  summary: "Open 7 days a week",
  groups: [
    { label: "Mon–Thu", hours: "11 am – 10:30 pm" },
    { label: "Fri–Sat", hours: "11 am – 1 am" },
    { label: "Sun", hours: "11 am – 10:30 pm" }
  ],
  ctaLabel: "Order now",
  ctaUrl: "/order"
};

const DEFAULT_OUR_STORY: SiteContent["site"]["ourStory"] = {
  eyebrow: "Our story",
  title: "Three friends. One kitchen table.",
  intro:
    "We are three childhood friends from Amsterdam with a shared passion for cooking and a deep love for Mexican cuisine.",
  paragraphs: [
    "What started as a dream at the kitchen table, grew into Tres Amigos: a contemporary Tex-Mex concept that revolves around friendship, hospitality and good food.",
    "At Tres Amigos we serve well-known classics such as burritos, tacos and quesadillas – with a modern twist, inspired by our personal style and always prepared with attention to quality and taste. Our goal is to let people enjoy fresh and affordable food in a lively, accessible setting.",
    "What sets us apart is not only our menu, but especially the energy we bring as young entrepreneurs. We build with heart and soul a place where you feel welcome – whether you step in for a quick bite or a cozy evening with friends."
  ],
  scheduleSummary: "Open 7 Days a week · Sun–Thu: 11 am–10:30 pm · Fri–Sat: 11 am–1 am",
  heroImage: "assets/site/restaurant-interior.jpg",
  sideImage: "assets/brand/home-card.png"
};

const DEFAULT_REVIEWS: SiteContent["site"]["reviews"] = {
  enabled: true,
  eyebrow: "Testimonials",
  title: "What guests say",
  minRating: 4,
  googlePlaceId: "",
  submitEnabled: true,
  submitTitle: "Share your experience",
  submitIntro: "Had a great meal at Tres Amigos? Leave a review — we moderate every submission before it appears on the site.",
  submitSuccessMessage: "Thanks! Your review has been sent and will appear after approval.",
  curated: [
    {
      id: "review-leyre",
      author: "Leyre Martinez Valencia",
      rating: 5,
      text: "¡Estos tacos están bien chidos! Every time I eat them, they leave me wanting more. The people here are super friendly and service is amazing. Definitely my favorite taco spot! ¡Andale wey!",
      publishedAt: "2025-06-26"
    },
    {
      id: "review-andrea",
      author: "Tomaselli Andrea",
      rating: 5,
      text: "As a mexican chef myself I have to say that this place surprised me I'll surely come back!",
      publishedAt: "2025-06-23"
    },
    {
      id: "review-monteiro",
      author: "Tomaselli Monteiro",
      rating: 5,
      text: "Amazing food and beautiful Spanish people",
      publishedAt: "2025-06-23"
    },
    {
      id: "review-sergio",
      author: "Sergio Ortiz Bellota",
      rating: 5,
      text: "Great food and great service. I highly recommend the XL Chicken Tacos, some of the best I've ever eat. Very recommended.",
      publishedAt: "2025-06-18"
    },
    {
      id: "review-carlos",
      author: "Carlos",
      rating: 5,
      text: "This restaurant is an absolute gem! The food is delicious and full of flavor, yet surprisingly affordable. What really sets it apart, though, is the staff: the waiters are incredibly friendly, attentive, and make you feel genuinely welcome. Highly recommended!",
      publishedAt: "2025-06-17"
    },
    {
      id: "review-hamid",
      author: "Hamid Abdel",
      rating: 5,
      text: "Had a chicken burrito 🌯 — super tasty! The Spanish girl who helped me was really nice and attentive. Great vibe. Will be back!",
      publishedAt: "2025-06-15"
    }
  ]
};

const DEFAULT_INSTAGRAM: SiteContent["site"]["instagram"] = {
  enabled: true,
  handle: "tresamigosamsterdam",
  profileUrl: "https://www.instagram.com/tresamigosamsterdam/",
  eyebrow: "Instagram",
  title: "Follow our kitchen",
  bio: "Mexican streetfood in Amsterdam",
  posts: [
    {
      id: "ig-1",
      image: "assets/site/restaurant-interior.jpg",
      url: "https://www.instagram.com/tresamigosamsterdam/",
      caption: "Real Mexican street food",
      active: true
    },
    {
      id: "ig-2",
      image: "assets/site/quesadilla-drinks.webp",
      url: "https://www.instagram.com/tresamigosamsterdam/",
      caption: "Quesadillas & drinks",
      active: true
    },
    {
      id: "ig-3",
      image: "assets/brand/eat-like-a-mexican.png",
      url: "https://www.instagram.com/tresamigosamsterdam/",
      caption: "Eat like a Mexican",
      active: true
    },
    {
      id: "ig-4",
      image: "assets/brand/home-card.png",
      url: "https://www.instagram.com/tresamigosamsterdam/",
      caption: "Tres Amigos vibes",
      active: true
    }
  ]
};

const DEFAULT_PROMO_POPUP: SiteContent["site"]["promoPopup"] = {
  enabled: true,
  delaySeconds: 18,
  title: "You've got 10% off",
  subtitle: "Enter your details to receive your discount code by email.",
  discountCode: "AMIGOS10",
  image: "assets/site/quesadilla-drinks.webp",
  successMessage: "Check your inbox — your discount code is on the way."
};

const DEFAULT_MAIL_RELAY: SiteContent["site"]["mailRelay"] = {
  enabled: false,
  fromName: "Tres Amigos",
  replyTo: "info@tresamigos.nl",
  subject: "Your 10% Tres Amigos discount",
  bodyTemplate:
    "Hi {{firstName}},\n\nThanks for joining the Tres Amigos list.\n\nYour discount code: {{discountCode}}\n\nSee you soon!\nTres Amigos"
};

const DEFAULT_CONTACT_FORM: SiteContent["site"]["contactForm"] = {
  enabled: true,
  title: "Send us a message",
  intro: "Questions about locations, catering or partnerships? Fill in the form and we will reply by email.",
  successMessage: "Thanks — your message has been sent. We will get back to you soon.",
  notifySubject: "New contact message via tresamigos.nl",
  image: "assets/site/restaurant-interior.jpg"
};

function sanitizeOpeningHours(value: SiteContent["site"]["openingHours"] | undefined) {
  const raw = value || DEFAULT_OPENING_HOURS;
  const groups = Array.isArray(raw.groups)
    ? raw.groups
        .slice(0, 8)
        .map((group, index) => ({
          label: cleanText(group?.label, DEFAULT_OPENING_HOURS.groups[index]?.label || `Group ${index + 1}`, 80),
          hours: cleanText(group?.hours, DEFAULT_OPENING_HOURS.groups[index]?.hours || "", 120)
        }))
        .filter((group) => group.label && group.hours)
    : DEFAULT_OPENING_HOURS.groups;

  return {
    enabled: raw.enabled !== false,
    eyebrow: cleanText(raw.eyebrow, DEFAULT_OPENING_HOURS.eyebrow, 80),
    title: cleanText(raw.title, DEFAULT_OPENING_HOURS.title, 120),
    sectionLabel: cleanText(raw.sectionLabel, DEFAULT_OPENING_HOURS.sectionLabel, 80),
    summary: cleanText(raw.summary, DEFAULT_OPENING_HOURS.summary, 160),
    groups: groups.length ? groups : DEFAULT_OPENING_HOURS.groups,
    ctaLabel: cleanText(raw.ctaLabel, DEFAULT_OPENING_HOURS.ctaLabel, 80),
    ctaUrl: cleanUrl(raw.ctaUrl) || DEFAULT_OPENING_HOURS.ctaUrl
  };
}

function sanitizeOurStory(value: SiteContent["site"]["ourStory"] | undefined) {
  const raw = value || DEFAULT_OUR_STORY;
  const paragraphs = Array.isArray(raw.paragraphs)
    ? raw.paragraphs.map((item) => cleanText(item, "", 1200)).filter(Boolean).slice(0, 8)
    : DEFAULT_OUR_STORY.paragraphs;

  return {
    eyebrow: cleanText(raw.eyebrow, DEFAULT_OUR_STORY.eyebrow, 80),
    title: cleanText(raw.title, DEFAULT_OUR_STORY.title, 180),
    intro: cleanText(raw.intro, DEFAULT_OUR_STORY.intro, 600),
    paragraphs: paragraphs.length ? paragraphs : DEFAULT_OUR_STORY.paragraphs,
    scheduleSummary: cleanText(raw.scheduleSummary, DEFAULT_OUR_STORY.scheduleSummary, 240),
    heroImage: cleanUrl(raw.heroImage) || DEFAULT_OUR_STORY.heroImage,
    sideImage: cleanUrl(raw.sideImage) || DEFAULT_OUR_STORY.sideImage
  };
}

function sanitizeReviews(value: SiteContent["site"]["reviews"] | undefined) {
  const raw = value || DEFAULT_REVIEWS;
  const minRating = Math.min(5, Math.max(1, Number(raw.minRating) || DEFAULT_REVIEWS.minRating));
  const curated = Array.isArray(raw.curated)
    ? raw.curated
        .slice(0, 24)
        .map((review, index) => ({
          id: cleanSlug(review?.id, `review-${index + 1}`),
          author: cleanText(review?.author, "Guest", 120),
          rating: Math.min(5, Math.max(1, Number(review?.rating) || 5)),
          text: cleanText(review?.text, "", 1200),
          relativeTime: cleanText(review?.relativeTime, "", 80),
          publishedAt: cleanText(review?.publishedAt, "", 40)
        }))
        .filter((review) => review.text && review.rating >= minRating)
    : DEFAULT_REVIEWS.curated;

  return {
    enabled: raw.enabled !== false,
    eyebrow: cleanText(raw.eyebrow, DEFAULT_REVIEWS.eyebrow, 80),
    title: cleanText(raw.title, DEFAULT_REVIEWS.title, 120),
    minRating,
    googlePlaceId: cleanText(raw.googlePlaceId, "", 120),
    submitEnabled: raw.submitEnabled !== false,
    submitTitle: cleanText(raw.submitTitle, DEFAULT_REVIEWS.submitTitle, 120),
    submitIntro: cleanText(raw.submitIntro, DEFAULT_REVIEWS.submitIntro, 400),
    submitSuccessMessage: cleanText(raw.submitSuccessMessage, DEFAULT_REVIEWS.submitSuccessMessage, 240),
    curated: curated.length ? curated : DEFAULT_REVIEWS.curated
  };
}

function sanitizeInstagram(value: SiteContent["site"]["instagram"] | undefined) {
  const raw = value || DEFAULT_INSTAGRAM;
  const posts = Array.isArray(raw.posts)
    ? raw.posts
        .slice(0, 24)
        .map((post, index) => ({
          id: cleanSlug(post?.id, `ig-${index + 1}`),
          image: cleanUrl(post?.image) || DEFAULT_INSTAGRAM.posts[0]?.image || "",
          url: cleanUrl(post?.url) || DEFAULT_INSTAGRAM.profileUrl,
          caption: cleanText(post?.caption, "", 240),
          active: post?.active !== false
        }))
        .filter((post) => post.image)
    : DEFAULT_INSTAGRAM.posts;

  return {
    enabled: raw.enabled !== false,
    handle: cleanText(raw.handle, DEFAULT_INSTAGRAM.handle, 80).replace(/^@/, ""),
    profileUrl: cleanUrl(raw.profileUrl) || DEFAULT_INSTAGRAM.profileUrl,
    eyebrow: cleanText(raw.eyebrow, DEFAULT_INSTAGRAM.eyebrow, 80),
    title: cleanText(raw.title, DEFAULT_INSTAGRAM.title, 120),
    bio: cleanText(raw.bio, DEFAULT_INSTAGRAM.bio, 240),
    posts: posts.length ? posts : DEFAULT_INSTAGRAM.posts
  };
}

function sanitizePromoPopup(value: SiteContent["site"]["promoPopup"] | undefined) {
  const raw = value || DEFAULT_PROMO_POPUP;
  const delaySeconds = Math.min(120, Math.max(5, Number(raw.delaySeconds) || DEFAULT_PROMO_POPUP.delaySeconds));

  return {
    enabled: raw.enabled !== false,
    delaySeconds,
    title: cleanText(raw.title, DEFAULT_PROMO_POPUP.title, 160),
    subtitle: cleanText(raw.subtitle, DEFAULT_PROMO_POPUP.subtitle, 320),
    discountCode: cleanText(raw.discountCode, DEFAULT_PROMO_POPUP.discountCode, 40),
    image: cleanUrl(raw.image) || DEFAULT_PROMO_POPUP.image,
    successMessage: cleanText(raw.successMessage, DEFAULT_PROMO_POPUP.successMessage, 240)
  };
}

function sanitizeMailRelay(value: SiteContent["site"]["mailRelay"] | undefined) {
  const raw = value || DEFAULT_MAIL_RELAY;
  return {
    enabled: raw.enabled === true,
    fromName: cleanText(raw.fromName, DEFAULT_MAIL_RELAY.fromName, 120),
    replyTo: cleanText(raw.replyTo, DEFAULT_MAIL_RELAY.replyTo, 180),
    subject: cleanText(raw.subject, DEFAULT_MAIL_RELAY.subject, 180),
    bodyTemplate: cleanText(raw.bodyTemplate, DEFAULT_MAIL_RELAY.bodyTemplate, 4000)
  };
}

function sanitizeContactForm(value: SiteContent["site"]["contactForm"] | undefined) {
  const raw = value || DEFAULT_CONTACT_FORM;
  return {
    enabled: raw.enabled !== false,
    title: cleanText(raw.title, DEFAULT_CONTACT_FORM.title, 120),
    intro: cleanText(raw.intro, DEFAULT_CONTACT_FORM.intro, 500),
    successMessage: cleanText(raw.successMessage, DEFAULT_CONTACT_FORM.successMessage, 240),
    notifySubject: cleanText(raw.notifySubject, DEFAULT_CONTACT_FORM.notifySubject, 180),
    image: cleanUrl(raw.image) || DEFAULT_CONTACT_FORM.image
  };
}

const DEFAULT_SEO_PAGES: Record<SeoPageKey, PageSeo> = {
  home: {
    title: "Tres Amigos | Mexican Street Food Amsterdam",
    description:
      "Tres Amigos Amsterdam. Real Mexican street food met tacos, burritos, bowls en bestelopties per vestiging."
  },
  menu: {
    title: "Menu | Tres Amigos",
    description: "Bekijk het Tres Amigos menu met tacos, burritos, quesadillas, bowls, sides en desserts."
  },
  locations: {
    title: "Locations | Tres Amigos",
    description: "Alle Tres Amigos vestigingen in Amsterdam met adressen en bestelopties."
  },
  order: {
    title: "Order | Tres Amigos",
    description: "Bestel bij Tres Amigos Amsterdam per vestiging via Take Away, Delivery, Thuisbezorgd of Uber Eats."
  },
  contact: {
    title: "Contact | Tres Amigos",
    description: "Neem contact op met Tres Amigos Amsterdam voor vragen over vestigingen, catering of samenwerking."
  },
  ourStory: {
    title: "Our Story | Tres Amigos",
    description: "Het verhaal achter Tres Amigos Amsterdam: real Mexican street food by real Mexicans."
  },
  vacancy: {
    title: "Work With Us | Tres Amigos",
    description: "Solliciteer bij Tres Amigos Amsterdam voor rollen in keuken, service en delivery."
  }
};

function sanitizeSeoPages(seo: SiteContent["site"]["seo"]): Record<SeoPageKey, PageSeo> {
  const rawPages =
    seo.pages && typeof seo.pages === "object" ? (seo.pages as Partial<Record<SeoPageKey, Partial<PageSeo>>>) : {};

  return SEO_PAGE_KEYS.reduce(
    (pages, key) => {
      const page = rawPages[key] || {};
      const legacyTitle =
        key === "home"
          ? seo.title
          : key === "menu"
            ? seo.menuTitle
            : undefined;
      const legacyDescription =
        key === "home"
          ? seo.description
          : key === "menu"
            ? seo.menuDescription
            : undefined;

      pages[key] = {
        title: cleanText(page.title || legacyTitle, DEFAULT_SEO_PAGES[key].title, 180),
        description: cleanText(page.description || legacyDescription, DEFAULT_SEO_PAGES[key].description, 300)
      };
      return pages;
    },
    {} as Record<SeoPageKey, PageSeo>
  );
}

const APPLICATION_ATTACHMENT_DATA_PREFIXES = [
  "data:application/pdf;base64,",
  "data:application/msword;base64,",
  "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,",
  "data:application/octet-stream;base64,"
];

function isAllowedApplicationAttachment(name: string, data: string) {
  const lower = name.toLowerCase();
  const extOk = lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx");
  if (!extOk) return false;
  return APPLICATION_ATTACHMENT_DATA_PREFIXES.some((prefix) => data.startsWith(prefix));
}

export function sanitizeApplication(input: CreateApplicationInput | Application): Application {
  const pdf = input?.pdf && typeof input.pdf === "object" ? input.pdf : null;
  const pdfName = cleanText(pdf?.name, "", 180);
  const pdfData = cleanText(pdf?.data, "", 16_000_000);

  return {
    id: cleanText(input?.id, crypto.randomUUID(), 80),
    createdAt: cleanText(input?.createdAt, new Date().toISOString(), 80),
    status: cleanText(input?.status, "nieuw", 40),
    role: cleanText(input?.role, "", 160),
    name: cleanText(input?.name, "", 160),
    email: cleanText(input?.email, "", 180),
    phone: cleanText(input?.phone, "", 80),
    days: cleanList(input?.days, WEEK_DAYS, 7) as WeekDay[],
    availabilityNote: cleanText(input?.availabilityNote, "", 1000),
    experience: cleanText(input?.experience, "", 1600),
    motivation: cleanText(input?.motivation, "", 1600),
    pdf:
      pdfName && isAllowedApplicationAttachment(pdfName, pdfData)
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
  const vacancy = site.vacancy;
  const openingHours = site.openingHours;
  const ourStory = site.ourStory;
  const reviews = site.reviews;
  const instagram = site.instagram;
  const promoPopup = site.promoPopup;
  const mailRelay = site.mailRelay;
  const contactForm = site.contactForm;

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
                image: cleanUrl(item.image),
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
        image: cleanUrl(seo.image),
        pages: sanitizeSeoPages(seo),
        title: cleanText(seo.title, DEFAULT_SEO_PAGES.home.title, 180),
        description: cleanText(seo.description, DEFAULT_SEO_PAGES.home.description, 300),
        menuTitle: cleanText(seo.menuTitle, DEFAULT_SEO_PAGES.menu.title, 180),
        menuDescription: cleanText(seo.menuDescription, DEFAULT_SEO_PAGES.menu.description, 300)
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
      },
      openingHours: sanitizeOpeningHours(openingHours),
      ourStory: sanitizeOurStory(ourStory),
      reviews: sanitizeReviews(reviews),
      instagram: sanitizeInstagram(instagram),
      promoPopup: sanitizePromoPopup(promoPopup),
      mailRelay: sanitizeMailRelay(mailRelay),
      contactForm: sanitizeContactForm(contactForm),
      vacancy: sanitizeVacancySettings(vacancy)
    },
    videos,
    menu,
    locations
  };
}

export function sanitizeReviewSubmission(input: unknown): import("@tresamigos/types").ReviewSubmission {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const statusRaw = cleanText(raw.status, "pending", 20);
  const status =
    statusRaw === "approved" || statusRaw === "spam" || statusRaw === "pending" ? statusRaw : "pending";

  return {
    id: cleanText(raw.id, crypto.randomUUID(), 80),
    createdAt: cleanText(raw.createdAt, new Date().toISOString(), 40),
    status,
    author: cleanText(raw.author, "Guest", 120),
    email: cleanText(raw.email, "", 180),
    rating: Math.min(5, Math.max(1, Number(raw.rating) || 5)),
    text: cleanText(raw.text, "", 1200),
    publishedAt: cleanText(raw.publishedAt, "", 40)
  };
}

export function sanitizeCreateReviewInput(input: unknown): import("@tresamigos/types").CreateReviewInput {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    author: cleanText(raw.author, "", 120),
    email: cleanText(raw.email, "", 180),
    rating: Math.min(5, Math.max(1, Number(raw.rating) || 5)),
    text: cleanText(raw.text, "", 1200)
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
