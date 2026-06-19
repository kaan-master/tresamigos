export type ApplicationRole = string;

export type WeekDay =
  | "Maandag"
  | "Dinsdag"
  | "Woensdag"
  | "Donderdag"
  | "Vrijdag"
  | "Zaterdag"
  | "Zondag";

export interface OrderLink {
  label: string;
  url: string;
}

export interface Location {
  id: string;
  area: string;
  name: string;
  address: string;
  note: string;
  featured?: boolean;
  active?: boolean;
  links: OrderLink[];
}

export interface Video {
  id: string;
  title: string;
  caption: string;
  src: string;
  active?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  featured?: boolean;
  active?: boolean;
}

export interface MenuCategory {
  id: string;
  title: string;
  orderLabel: string;
  active?: boolean;
  items: MenuItem[];
}

export const SEO_PAGE_KEYS = [
  "home",
  "menu",
  "locations",
  "order",
  "contact",
  "ourStory",
  "vacancy"
] as const;

export type SeoPageKey = (typeof SEO_PAGE_KEYS)[number];

export interface PageSeo {
  title: string;
  description: string;
}

export const SEO_PAGE_LABELS: Record<SeoPageKey, string> = {
  home: "Home",
  menu: "Menu",
  locations: "Vestigingen",
  order: "Bestellen",
  contact: "Contact",
  ourStory: "Our Story",
  vacancy: "Vacatures"
};

export interface VacancyJob {
  id: string;
  enabled: boolean;
  title: string;
  summary: string;
  requirements: string[];
  fullDescription: string;
  applyLabel: string;
  image: string;
}

/** @deprecated gebruik VacancyJob */
export interface VacancyRoleConfig {
  enabled: boolean;
  title: string;
  copy: string;
}

export interface VacancySettings {
  heroTitle: string;
  heroIntro: string;
  heroImage: string;
  formImage: string;
  jobs: VacancyJob[];
}

export interface OpeningHoursGroup {
  label: string;
  hours: string;
}

export interface OpeningHoursSettings {
  enabled: boolean;
  eyebrow: string;
  title: string;
  sectionLabel: string;
  summary: string;
  groups: OpeningHoursGroup[];
  ctaLabel: string;
  ctaUrl: string;
}

export interface OurStorySettings {
  eyebrow: string;
  title: string;
  intro: string;
  paragraphs: string[];
  scheduleSummary: string;
  heroImage: string;
  sideImage: string;
}

export interface GoogleReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
  publishedAt?: string;
}

export interface ReviewsSettings {
  enabled: boolean;
  eyebrow: string;
  title: string;
  minRating: number;
  googlePlaceId: string;
  submitEnabled: boolean;
  submitTitle: string;
  submitIntro: string;
  submitSuccessMessage: string;
  curated: GoogleReview[];
}

export interface InstagramPost {
  id: string;
  image: string;
  url: string;
  caption: string;
  active?: boolean;
}

export interface InstagramFeedPost {
  id: string;
  image: string;
  url: string;
  caption: string;
  isVideo?: boolean;
}

export interface InstagramFeedResponse {
  enabled: boolean;
  handle: string;
  profileUrl: string;
  bio: string;
  profileImage?: string;
  posts: InstagramFeedPost[];
  source: "instagram" | "fallback";
  updatedAt: string;
}

export interface InstagramSettings {
  enabled: boolean;
  handle: string;
  profileUrl: string;
  eyebrow: string;
  title: string;
  bio: string;
  posts: InstagramPost[];
}

export type ReviewSubmissionStatus = "pending" | "approved" | "spam";

export interface ReviewSubmission {
  id: string;
  createdAt: string;
  status: ReviewSubmissionStatus;
  author: string;
  email: string;
  rating: number;
  text: string;
  publishedAt: string;
}

export interface CreateReviewInput {
  author: string;
  email?: string;
  rating: number;
  text: string;
}

export interface UpdateReviewSubmissionInput {
  status: ReviewSubmissionStatus;
}

export interface PromoPopupSettings {
  enabled: boolean;
  delaySeconds: number;
  title: string;
  subtitle: string;
  discountCode: string;
  image: string;
  successMessage: string;
}

export interface MailRelaySettings {
  enabled: boolean;
  fromName: string;
  replyTo: string;
  subject: string;
  bodyTemplate: string;
}

export interface ContactFormSettings {
  enabled: boolean;
  title: string;
  intro: string;
  successMessage: string;
  notifySubject: string;
  image: string;
}

export interface ContactSubmitInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface MediaAsset {
  url: string;
  filename: string;
  size: number;
  section: "site" | "brand" | "uploads" | "cms";
  kind: "image" | "video";
  removable: boolean;
  label?: string;
}

export interface MediaLibraryResponse {
  assets: MediaAsset[];
}

export interface AnalyticsSnapshot {
  liveNow: number;
  viewsToday: number;
  viewsWeek: number;
  topPages: { path: string; views: number }[];
  updatedAt: string;
}

export interface AnalyticsPingInput {
  sessionId: string;
  path: string;
}
export interface SiteSettings {
  seo: {
    image: string;
    pages: Record<SeoPageKey, PageSeo>;
    /** @deprecated gebruik seo.pages.home */
    title?: string;
    /** @deprecated gebruik seo.pages.home */
    description?: string;
    /** @deprecated gebruik seo.pages.menu */
    menuTitle?: string;
    /** @deprecated gebruik seo.pages.menu */
    menuDescription?: string;
  };
  navCta: {
    label: string;
    url: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    intro: string;
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel: string;
    secondaryUrl: string;
    tags: string[];
  };
  footer: {
    title: string;
    intro: string;
    email: string;
    instagramUrl: string;
    tiktokUrl: string;
    copyright: string;
  };
  videosSection: {
    eyebrow: string;
    title: string;
    intro: string;
  };
  openingHours: OpeningHoursSettings;
  ourStory: OurStorySettings;
  reviews: ReviewsSettings;
  instagram: InstagramSettings;
  promoPopup: PromoPopupSettings;
  mailRelay: MailRelaySettings;
  contactForm: ContactFormSettings;
  vacancy: VacancySettings;
}

export interface ReviewsResponse {
  reviews: GoogleReview[];
  source: "google" | "curated" | "mixed";
  updatedAt: string;
}

export interface PromoSubscribeInput {
  firstName: string;
  lastName: string;
  email: string;
}

export interface SiteContent {
  site: SiteSettings;
  videos: Video[];
  menu: MenuCategory[];
  locations: Location[];
}

export const APPLICATION_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const APPLICATION_ATTACHMENT_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export interface ApplicationPdf {
  name: string;
  size: number;
  data: string;
}

export interface Application {
  id: string;
  createdAt: string;
  status: string;
  role: ApplicationRole;
  name: string;
  email: string;
  phone: string;
  days: WeekDay[];
  availabilityNote: string;
  experience: string;
  motivation: string;
  pdf: ApplicationPdf | null;
}

export interface CreateApplicationInput {
  id?: string;
  createdAt?: string;
  status?: string;
  role: ApplicationRole;
  name: string;
  email: string;
  phone?: string;
  days: WeekDay[];
  availabilityNote?: string;
  experience?: string;
  motivation?: string;
  pdf?: ApplicationPdf | null;
}

export interface LoginResponse {
  token: string;
}

export interface ApiMessage {
  message: string;
}

export interface ApplicationsResponse {
  applications: Application[];
}

export interface CreateApplicationResponse extends ApiMessage {
  application: {
    id: string;
    createdAt: string;
  };
}

export const APPLICATION_ROLES: ApplicationRole[] = [];

export const WEEK_DAYS: WeekDay[] = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag"
];
