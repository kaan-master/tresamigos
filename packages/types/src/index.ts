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
  code?: string;
  featured?: boolean;
  active?: boolean;
  links: OrderLink[];
}

export function formatStoreCode(raw: unknown, fallbackIndex = 0): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const parsed = digits ? Number(digits.slice(-3)) : fallbackIndex + 1;
  const value = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 999) : fallbackIndex + 1;
  return String(value).padStart(3, "0");
}

export function storeLabel(code: string | null | undefined, name: string) {
  const trimmed = String(code || "").trim();
  return trimmed ? `${trimmed} ${name}` : name;
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
  "ourValue",
  "vacancy",
  "franchise",
  "loyalty",
  "privacy",
  "terms"
] as const;

export type SeoPageKey = (typeof SEO_PAGE_KEYS)[number];

export interface PageSeo {
  title: string;
  description: string;
  noindex?: boolean;
}

export const SEO_PAGE_LABELS: Record<SeoPageKey, string> = {
  home: "Home",
  menu: "Menu",
  locations: "Vestigingen",
  order: "Bestellen",
  contact: "Contact",
  ourStory: "Our Story",
  ourValue: "Our Value",
  vacancy: "Vacatures",
  franchise: "Franchise",
  loyalty: "Loyalty",
  privacy: "Privacy",
  terms: "Voorwaarden"
};

export const NAV_MAIN_ITEM_IDS = [
  "menu",
  "catering",
  "franchise",
  "loyalty",
  "ourStory",
  "ourValue",
  "vacancy",
  "contact"
] as const;

/** Kept for CMS backwards-compat; not in main defaults (locations page still exists). */
export const NAV_LEGACY_MAIN_ITEM_IDS = ["locations"] as const;

export const NAV_UTILITY_ITEM_IDS = ["findTresAmigos", "login"] as const;

export const NAV_ITEM_IDS = [
  ...NAV_MAIN_ITEM_IDS,
  ...NAV_LEGACY_MAIN_ITEM_IDS,
  ...NAV_UTILITY_ITEM_IDS
] as const;

export type NavMainItemId = (typeof NAV_MAIN_ITEM_IDS)[number];
export type NavUtilityItemId = (typeof NAV_UTILITY_ITEM_IDS)[number];
export type NavItemId = (typeof NAV_ITEM_IDS)[number];

export const NAV_ITEM_ADMIN_LABELS: Record<NavItemId, string> = {
  menu: "Menu",
  catering: "Catering",
  franchise: "Franchise",
  loyalty: "Loyalty",
  locations: "Vestigingen (verborgen)",
  ourStory: "Our Story",
  ourValue: "Our Value",
  vacancy: "Vacatures",
  contact: "Contact",
  findTresAmigos: "Vind je Tres Amigos",
  login: "Inloggen (verborgen)"
};

export interface NavItemConfig {
  id: NavItemId;
  visible: boolean;
  sortOrder: number;
  group: "main" | "utility";
}

export interface NavSettings {
  items: NavItemConfig[];
}

export const ADMIN_TAB_IDS = [
  "overview",
  "home",
  "locations",
  "products",
  "media",
  "pageMedia",
  "applications",
  "franchise",
  "franchiseShop",
  "newsletter",
  "catering",
  "reviews",
  "seo",
  "navigation",
  "footer",
  "integrations",
  "users",
  "tellingen",
  "todo"
] as const;

export type AdminTabId = (typeof ADMIN_TAB_IDS)[number];

export const ADMIN_TAB_LABELS: Record<AdminTabId, string> = {
  overview: "Overzicht",
  home: "Home",
  locations: "Vestigingen",
  products: "Producten",
  media: "Media",
  pageMedia: "Pagina media",
  applications: "Sollicitaties",
  franchise: "Franchise",
  franchiseShop: "Franchise shop",
  newsletter: "Nieuwsbrief",
  catering: "Catering",
  reviews: "Reviews",
  seo: "SEO",
  navigation: "Navigatie",
  footer: "Footer",
  integrations: "Integraties",
  users: "Gebruikers",
  tellingen: "Tellingen",
  todo: "To do"
};

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  permissions: AdminTabId[];
  avatarData: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: "master" | "employee";
  permissions: AdminTabId[];
}

export interface AdminLoginResponse {
  token: string;
  user: AdminSessionUser;
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  password: string;
  permissions: AdminTabId[];
  avatarData?: string;
}

export interface UpdateAdminUserInput {
  name?: string;
  password?: string;
  permissions?: AdminTabId[];
  active?: boolean;
  /** Lege string verwijdert de foto. Data-URL (PNG of JPEG) zet een nieuwe. */
  avatarData?: string;
}

export interface VacancyJob {
  id: string;
  enabled: boolean;
  title: string;
  summary: string;
  requirements: string[];
  fullDescription: string;
  applyLabel: string;
  image: string;
  /** kitchen | leadership | operations */
  category?: string;
  /** fulltime | parttime */
  employmentType?: string;
  /** Vestiging of gebied, bv. Amsterdam Oost */
  location?: string;
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

export type OurValueSettings = OurStorySettings;

/** Relatieve focus in procent (0–100) voor object-position / background-position. */
export interface PageMediaSlot {
  src: string;
  focalPointX: number;
  focalPointY: number;
}

export const PAGE_MEDIA_PAGE_IDS = [
  "home",
  "ourStory",
  "ourValue",
  "loyalty",
  "franchise",
  "vacancy",
  "contact"
] as const;

export type PageMediaPageId = (typeof PAGE_MEDIA_PAGE_IDS)[number];

export const PAGE_MEDIA_PAGE_LABELS: Record<PageMediaPageId, string> = {
  home: "Home",
  ourStory: "Ons verhaal",
  ourValue: "Onze waarden",
  loyalty: "Loyalty",
  franchise: "Franchise",
  vacancy: "Werken bij ons",
  contact: "Contact"
};

export interface PageMediaSettings {
  loyalty: {
    hero: PageMediaSlot;
    guests: PageMediaSlot;
    dining: PageMediaSlot;
    cheers: PageMediaSlot;
  };
  franchise: {
    hero: PageMediaSlot;
    story: PageMediaSlot;
  };
  vacancy: {
    hero: PageMediaSlot;
  };
  home: {
    showcase: PageMediaSlot;
    guests: PageMediaSlot;
  };
  ourValue: {
    hero: PageMediaSlot;
    side: PageMediaSlot;
    grid1: PageMediaSlot;
    grid2: PageMediaSlot;
    grid3: PageMediaSlot;
  };
  ourStory: {
    hero: PageMediaSlot;
  };
  contact: {
    visual: PageMediaSlot;
  };
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
  isVideo?: boolean;
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
  section: "site" | "brand" | "uploads" | "cms" | "catering" | "menu";
  kind: "image" | "video";
  removable: boolean;
  label?: string;
}

export interface MediaLibraryResponse {
  assets: MediaAsset[];
}

export interface AnalyticsDailyEntry {
  date: string;
  visitors: number;
}

export interface AnalyticsHourlyEntry {
  hour: number;
  visitors: number;
}

export interface AnalyticsSnapshot {
  liveNow: number;
  viewsToday: number;
  viewsWeek: number;
  topPages: { path: string; views: number }[];
  dailyLog: AnalyticsDailyEntry[];
  hourlyBusyAverage: AnalyticsHourlyEntry[];
  updatedAt: string;
}

export interface PublicAnalyticsStats {
  liveNow: number;
  viewsToday: number;
  dailyLog: AnalyticsDailyEntry[];
  updatedAt: string;
}

export interface AnalyticsPingInput {
  sessionId: string;
  path: string;
}
export interface SiteSettings {
  seo: {
    image: string;
    siteUrl: string;
    googleSiteVerification: string;
    bingSiteVerification: string;
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
  navigation: NavSettings;
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
  ourValue: OurValueSettings;
  reviews: ReviewsSettings;
  instagram: InstagramSettings;
  promoPopup: PromoPopupSettings;
  mailRelay: MailRelaySettings;
  contactForm: ContactFormSettings;
  vacancy: VacancySettings;
  catering: CateringSettings;
  pageMedia: PageMediaSettings;
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

export const APPLICATION_STATUSES = [
  "nieuw",
  "contact_opgenomen",
  "in_gesprek",
  "aangenomen",
  "afgewezen",
  "ingetrokken"
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  nieuw: "Nieuw",
  contact_opgenomen: "Contact opgenomen",
  in_gesprek: "In gesprek",
  aangenomen: "Aangenomen",
  afgewezen: "Afgewezen",
  ingetrokken: "Ingetrokken"
};

export interface Application {
  id: string;
  createdAt: string;
  status: ApplicationStatus;
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

export interface UpdateApplicationStatusInput {
  status: ApplicationStatus;
}

export interface CreateApplicationInput {
  id?: string;
  createdAt?: string;
  status?: ApplicationStatus | string;
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

export interface FranchiseInquiry {
  id: string;
  createdAt: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  desiredLocation: string;
  currentRole: string;
  company: string;
  investment: string;
  financing: string;
  visitedLocation: string;
  termsAccepted: boolean;
}

export interface CreateFranchiseInquiryInput {
  id?: string;
  createdAt?: string;
  status?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  desiredLocation?: string;
  currentRole?: string;
  company?: string;
  investment?: string;
  financing?: string;
  visitedLocation?: string;
  termsAccepted: boolean;
}

export interface FranchiseInquiriesResponse {
  inquiries: FranchiseInquiry[];
}

export interface CreateFranchiseInquiryResponse extends ApiMessage {
  inquiry: {
    id: string;
    createdAt: string;
  };
}

export interface NewsletterSubscribeInput {
  email: string;
  name?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string;
  subscribedAt: string;
}

export interface NewsletterSubscribersResponse {
  subscribers: NewsletterSubscriber[];
}

export interface CreateNewsletterSubscribeResponse extends ApiMessage {
  alreadySubscribed?: boolean;
}

export type MailRelayProvider = "smtp" | "outlook" | "google";

export type MailNotifyCategory = "applications" | "catering" | "franchise" | "other";

export interface IntegrationMailNotifications {
  applications: string;
  catering: string;
  franchise: string;
  other: string;
}

export interface IntegrationGoogleCategoryAccount {
  connected: boolean;
  email: string;
}

export type IntegrationGoogleByCategory = Record<MailNotifyCategory, IntegrationGoogleCategoryAccount>;

export interface IntegrationMailRelaySettings {
  enabled: boolean;
  provider: MailRelayProvider;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordSet: boolean;
  fromEmail: string;
  fromName: string;
  lastTestAt: string | null;
  lastStatus: string;
  lastMessage: string;
  envFallbackConfigured: boolean;
  googleConnected: boolean;
  googleEmail: string;
  googleOAuthConfigured: boolean;
  googleOAuthSource: "db" | "env" | "none";
  googleClientId: string;
  googleClientSecretSet: boolean;
  googleClientSecretMasked: string;
  googleRedirectUri: string;
  googleByCategory: IntegrationGoogleByCategory;
  notifications: IntegrationMailNotifications;
  canManageOutgoing: boolean;
  outgoingReady: boolean;
}

export interface IntegrationGoogleAdsSettings {
  enabled: boolean;
  conversionId: string;
}

export interface IntegrationNewsletterSettings {
  enabled: boolean;
  showFooter: boolean;
  showHome: boolean;
  showPages: boolean;
}

export interface IntegrationSettingsPublic {
  mailRelay: IntegrationMailRelaySettings;
  googleAds: IntegrationGoogleAdsSettings;
  newsletter: IntegrationNewsletterSettings;
}

/** Publieke subset voor de website (geen SMTP-secrets). */
export interface PublicIntegrationsSettings {
  googleAds: IntegrationGoogleAdsSettings;
  newsletter: IntegrationNewsletterSettings;
}

export interface UpdateIntegrationMailRelayInput {
  enabled?: boolean;
  provider?: MailRelayProvider;
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  password?: string;
  fromEmail?: string;
  fromName?: string;
  clearPassword?: boolean;
  notifications?: Partial<IntegrationMailNotifications>;
  disconnectGoogle?: boolean;
  disconnectGoogleCategory?: MailNotifyCategory;
  googleClientId?: string;
  googleClientSecret?: string;
}

export interface ClearGoogleOAuthSecretInput {
  /** Exact "bevestig" — enige geaccepteerde bevestigingstekst. */
  confirmation: string;
}

export interface UpdateIntegrationGoogleAdsInput {
  enabled?: boolean;
  conversionId?: string;
}

export interface UpdateIntegrationNewsletterInput {
  enabled?: boolean;
  showFooter?: boolean;
  showHome?: boolean;
  showPages?: boolean;
}

export type MailGoogleOAuthPurpose = "inbox" | "outbox";

export interface IntegrationTestMailInput {
  to?: string;
  category?: MailNotifyCategory;
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

export const CATERING_BOX_IDS = ["burrito-box", "bowl-box", "quesadilla-box", "taco-box", "shop"] as const;
export type CateringBoxId = (typeof CATERING_BOX_IDS)[number];
export type CateringFulfillment = "pickup" | "delivery";
export type CateringCategoryId =
  | "buffet"
  | "burrito"
  | "tacos"
  | "burritos"
  | "quesadillas"
  | "burrito-bowls"
  | "sides"
  | "sauces"
  | "desserts"
  | "drinks"
  | "deals"
  | "team-thanks";
export type CateringPackageTier = "budget" | "single" | "double" | "triple";

export interface CateringLocalizedText {
  nl: string;
  en: string;
}

export interface CateringServingOption {
  servings: number;
  extraCents: number;
}

export interface CateringCategoryConfig {
  id: CateringCategoryId;
  label: CateringLocalizedText;
  sortOrder: number;
  visible: boolean;
}

export const CATERING_INGREDIENT_GROUPS = [
  "protein",
  "buffetTopping",
  "burritoTopping",
  "sauce",
  "tortilla",
  "cream",
  "tripleCream"
] as const;

export type CateringIngredientGroup = (typeof CATERING_INGREDIENT_GROUPS)[number];

export const CATERING_INGREDIENT_GROUP_LABELS: Record<CateringIngredientGroup, string> = {
  protein: "Eiwitten",
  buffetTopping: "Buffet toppings",
  burritoTopping: "Burrito toppings",
  sauce: "Sauzen / salsa's",
  tortilla: "Tortilla's",
  cream: "Guacamole / sour cream",
  tripleCream: "Triple cream opties"
};

export interface CateringIngredientConfig {
  id: string;
  group: CateringIngredientGroup;
  label: CateringLocalizedText;
  image: string;
  active: boolean;
  sortOrder: number;
}

export interface CateringFormFieldConfig {
  id: string;
  label: CateringLocalizedText;
  enabled: boolean;
  required: boolean;
}

export interface CateringNotificationsSettings {
  recipientEmail: string;
  notifyOnNewOrder: boolean;
  notifyOnStatusChange: boolean;
}

export interface CateringFulfillmentModeSettings {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

export interface CateringFulfillmentSettings {
  pickup: CateringFulfillmentModeSettings;
  delivery: CateringFulfillmentModeSettings;
}

export interface CateringProductConfig {
  id: string;
  categoryId: CateringCategoryId;
  name: CateringLocalizedText;
  description: CateringLocalizedText;
  image: string;
  basePriceCents: number;
  active: boolean;
  sortOrder: number;
  minServings: number;
  maxServings: number;
  tier?: CateringPackageTier;
  configurable: boolean;
  servingOptions: CateringServingOption[];
}

export interface CateringSettings {
  maxOnlineServings: number;
  largeGroupEmail: string;
  categories: CateringCategoryConfig[];
  products: CateringProductConfig[];
  ingredients: CateringIngredientConfig[];
  formFields: CateringFormFieldConfig[];
  notifications: CateringNotificationsSettings;
  fulfillment: CateringFulfillmentSettings;
}

export interface CateringCartLine {
  id: string;
  productId: string;
  categoryId: CateringCategoryId;
  name: string;
  imageUrl?: string;
  tier?: CateringPackageTier;
  servings: number;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  configuration: Record<string, string | number | string[]>;
}

export const CATERING_ORDER_STATUSES = ["nieuw", "bevestigd", "voorbereid", "afgerond", "geannuleerd"] as const;
export type CateringOrderStatus = (typeof CATERING_ORDER_STATUSES)[number];

export interface CateringOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: CateringOrderStatus;
  items: CateringCartLine[];
  subtotalCents: number;
  boxId: CateringBoxId;
  quantity: number;
  proteins: string[];
  toppings: string[];
  salsas: string[];
  diet: string[];
  notes: string;
  fulfillment: CateringFulfillment;
  locationId: string;
  locationName: string;
  address: string;
  eventDate: string;
  eventTime: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  vatId: string;
  kvk: string;
  adminNotes: string;
}

export interface CreateCateringOrderInput {
  items: CateringCartLine[];
  subtotalCents: number;
  fulfillment: CateringFulfillment;
  locationId?: string;
  address?: string;
  eventDate: string;
  eventTime: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  vatId?: string;
  kvk?: string;
  notes?: string;
  /** @deprecated legacy single-box flow */
  boxId?: CateringBoxId;
  quantity?: number;
  proteins?: string[];
  toppings?: string[];
  salsas?: string[];
  diet?: string[];
}

export interface UpdateCateringOrderInput {
  status?: CateringOrderStatus;
  adminNotes?: string;
}

export interface CateringOrdersResponse {
  orders: CateringOrder[];
}

export interface CreateCateringOrderResponse extends ApiMessage {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
  };
}

export const COUNT_SHIFTS = ["morning", "evening"] as const;
export type CountShift = (typeof COUNT_SHIFTS)[number];

export const COUNT_STATUSES = ["draft", "submitted"] as const;
export type CountStatus = (typeof COUNT_STATUSES)[number];

export const COUNT_SHIFT_LABELS: Record<CountShift, string> = {
  morning: "Ochtendtelling",
  evening: "Avondtelling"
};

export interface CountList {
  id: string;
  title: string;
  active: boolean;
  sortOrder: number;
  productIds: string[];
  productCount: number;
}

export interface CountCategory {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  products: CountProduct[];
}

export interface CountProduct {
  id: string;
  categoryId: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

export interface CountStaffRecord {
  id: string;
  name: string;
  loginHint: string;
  active: boolean;
  locationId: string | null;
  locationName: string | null;
  locationCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCountStaffInput {
  name: string;
  loginNumber?: string;
  active?: boolean;
  locationId?: string | null;
}

export interface UpdateCountStaffInput {
  name?: string;
  loginNumber?: string;
  active?: boolean;
  locationId?: string | null;
}

export interface CreateCountStaffResponse extends ApiMessage {
  staff: CountStaffRecord;
  loginNumber: string;
}

export interface CountLineInput {
  productId: string;
  quantity?: number | null;
  note?: string;
}

export interface CountLine {
  id: string;
  productId: string | null;
  productName: string;
  categoryName: string;
  quantity: number | null;
  note: string;
  sortOrder: number;
}

export interface CountSession {
  id: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  listId: string;
  listTitle: string;
  staffId: string | null;
  staffName: string;
  shift: CountShift;
  status: CountStatus;
  countDate: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: CountLine[];
}

export interface CountSessionSummary {
  id: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  listId: string;
  listTitle: string;
  staffId: string | null;
  staffName: string;
  shift: CountShift;
  status: CountStatus;
  countDate: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineCount: number;
  noteCount: number;
}

export interface SaveCountSessionInput {
  locationId: string;
  listId: string;
  shift: CountShift;
  countDate?: string;
  lines: CountLineInput[];
}

export interface CountLocationOption {
  id: string;
  name: string;
  code: string;
}

export interface CountStaffSessionUser {
  id: string;
  name: string;
  locationId: string | null;
  locationName: string | null;
  locationCode: string | null;
}

export interface TellingLoginResponse {
  token: string;
  staff: CountStaffSessionUser;
}

export interface TellingMeResponse {
  staff: CountStaffSessionUser;
  locations: CountLocationOption[];
  lists: CountList[];
}

export interface CreateCountListInput {
  title: string;
  productIds?: string[];
}

export interface UpdateCountListInput {
  title?: string;
  active?: boolean;
  sortOrder?: number;
  productIds?: string[];
}

export interface CreateCountCategoryInput {
  name: string;
}

export interface UpdateCountCategoryInput {
  name?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface CreateCountProductInput {
  name: string;
  categoryId: string;
}

export interface UpdateCountProductInput {
  name?: string;
  categoryId?: string;
  active?: boolean;
  sortOrder?: number;
}

export interface CountListFilters {
  dateFrom?: string;
  dateTo?: string;
  locationId?: string;
  staffId?: string;
  listId?: string;
  weekday?: string;
  productId?: string;
  productName?: string;
  categoryName?: string;
  shift?: CountShift;
  status?: CountStatus;
}

export interface CountProductStat {
  productId: string | null;
  productName: string;
  categoryName: string;
  quantity: number;
  sessionCount: number;
}

export interface CountCategoryStat {
  categoryName: string;
  quantity: number;
  sessionCount: number;
}

/** Franchise shop — producten, prijzen per vestiging, bestellingen */
export const FRANCHISE_SHOP_ORDER_STATUSES = [
  "registratie_onvolledig",
  "in_afwachting",
  "actie_vereist",
  "bevestigd",
  "in_behandeling",
  "gereed_voor_verzending",
  "onderweg",
  "controle_bij_ontvangst",
  "afwijking",
  "nalevering_gepland",
  "afgerond",
  "geannuleerd"
] as const;
export type FranchiseShopOrderStatus = (typeof FRANCHISE_SHOP_ORDER_STATUSES)[number];

export const FRANCHISE_SHOP_ORDER_STATUS_LABELS: Record<FranchiseShopOrderStatus, string> = {
  registratie_onvolledig: "Registratie onvolledig",
  in_afwachting: "In afwachting",
  actie_vereist: "Actie vereist",
  bevestigd: "Bevestigd",
  in_behandeling: "In behandeling",
  gereed_voor_verzending: "Gereed voor verzending",
  onderweg: "Onderweg",
  controle_bij_ontvangst: "Controle bij ontvangst",
  afwijking: "Afwijking",
  nalevering_gepland: "Nalevering gepland",
  afgerond: "Afgerond",
  geannuleerd: "Geannuleerd"
};

export const FRANCHISE_SHOP_ORDER_STATUS_COLORS: Record<FranchiseShopOrderStatus, string> = {
  registratie_onvolledig: "#d66b36",
  in_afwachting: "#0078d4",
  actie_vereist: "#ca5010",
  bevestigd: "#5c2d91",
  in_behandeling: "#c19c00",
  gereed_voor_verzending: "#038387",
  onderweg: "#004e8c",
  controle_bij_ontvangst: "#8764b8",
  afwijking: "#d13438",
  nalevering_gepland: "#c45911",
  afgerond: "#107c10",
  geannuleerd: "#8a8886"
};

const FRANCHISE_SHOP_ORDER_STATUS_ALIASES: Record<string, FranchiseShopOrderStatus> = {
  nieuw: "in_afwachting",
  verzonden: "onderweg"
};

export function normalizeFranchiseShopOrderStatus(status: string): FranchiseShopOrderStatus {
  const mapped = FRANCHISE_SHOP_ORDER_STATUS_ALIASES[status] ?? status;
  return (FRANCHISE_SHOP_ORDER_STATUSES as readonly string[]).includes(mapped)
    ? (mapped as FranchiseShopOrderStatus)
    : "in_afwachting";
}

export const FRANCHISE_SHOP_ORDER_CHANNELS = ["portaal", "whatsapp", "email", "overig"] as const;
export type FranchiseShopOrderChannel = (typeof FRANCHISE_SHOP_ORDER_CHANNELS)[number];

export const FRANCHISE_SHOP_ORDER_CHANNEL_LABELS: Record<FranchiseShopOrderChannel, string> = {
  portaal: "Portaal",
  whatsapp: "WhatsApp",
  email: "E-mail",
  overig: "Overig"
};

export const FRANCHISE_SHOP_ORDER_HAPPY_PATH = [
  "in_afwachting",
  "bevestigd",
  "in_behandeling",
  "gereed_voor_verzending",
  "onderweg",
  "controle_bij_ontvangst",
  "afgerond"
] as const satisfies readonly FranchiseShopOrderStatus[];

export const FRANCHISE_SHOP_DEVIATION_KINDS = ["tekort", "schade", "fout"] as const;
export type FranchiseShopDeviationKind = (typeof FRANCHISE_SHOP_DEVIATION_KINDS)[number];

export const FRANCHISE_SHOP_DEVIATION_KIND_LABELS: Record<FranchiseShopDeviationKind, string> = {
  tekort: "Tekort",
  schade: "Schade",
  fout: "Fout"
};

export const FRANCHISE_SHOP_ORDER_ACTIONS = [
  "mark_incomplete",
  "request_missing_data",
  "complete_registration",
  "confirm_order",
  "require_action",
  "resolve_action",
  "start_processing",
  "mark_ready",
  "mark_shipped",
  "mark_arrived",
  "confirm_complete_receipt",
  "report_deviation",
  "plan_nalevering",
  "accept_with_deviation",
  "process_nalevering",
  "update_stock",
  "cancel"
] as const;
export type FranchiseShopOrderAction = (typeof FRANCHISE_SHOP_ORDER_ACTIONS)[number];

export type FranchiseShopOrderActionTone = "yes" | "no" | "next" | "danger" | "neutral";

export interface FranchiseShopOrderActionDef {
  id: FranchiseShopOrderAction;
  label: string;
  description: string;
  toStatus: FranchiseShopOrderStatus;
  tone: FranchiseShopOrderActionTone;
  stay?: boolean;
  noteLabel?: string;
  noteRequired?: boolean;
  notify?: boolean;
  extra?: "deviation" | "nalevering" | "stock";
}

export interface FranchiseShopOrderFlowEvent {
  at: string;
  action: FranchiseShopOrderAction | "registered";
  fromStatus: FranchiseShopOrderStatus | "";
  toStatus: FranchiseShopOrderStatus;
  note?: string;
  notified?: boolean;
}

export interface FranchiseShopOrderFlow {
  channel: FranchiseShopOrderChannel;
  missingData: string;
  kitchenNote: string;
  deviationKind: FranchiseShopDeviationKind | "";
  deviationNote: string;
  naleveringNote: string;
  receivedComplete: boolean | null;
  stockUpdatedAt: string | null;
  events: FranchiseShopOrderFlowEvent[];
}

export function emptyFranchiseShopOrderFlow(
  channel: FranchiseShopOrderChannel = "portaal"
): FranchiseShopOrderFlow {
  return {
    channel,
    missingData: "",
    kitchenNote: "",
    deviationKind: "",
    deviationNote: "",
    naleveringNote: "",
    receivedComplete: null,
    stockUpdatedAt: null,
    events: []
  };
}

function asChannel(value: unknown, fallback: FranchiseShopOrderChannel = "portaal"): FranchiseShopOrderChannel {
  return (FRANCHISE_SHOP_ORDER_CHANNELS as readonly string[]).includes(String(value || ""))
    ? (value as FranchiseShopOrderChannel)
    : fallback;
}

export function parseFranchiseShopOrderFlow(
  raw: unknown,
  fallbackChannel: FranchiseShopOrderChannel = "portaal"
): FranchiseShopOrderFlow {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const events = Array.isArray(source.events)
    ? source.events
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          at: String(item.at || ""),
          action: String(item.action || "registered") as FranchiseShopOrderFlowEvent["action"],
          fromStatus: String(item.fromStatus || "") as FranchiseShopOrderFlowEvent["fromStatus"],
          toStatus: normalizeFranchiseShopOrderStatus(String(item.toStatus || "in_afwachting")),
          note: item.note ? String(item.note) : undefined,
          notified: item.notified === true ? true : item.notified === false ? false : undefined
        }))
    : [];
  const kind = String(source.deviationKind || "");
  return {
    channel: asChannel(source.channel, fallbackChannel),
    missingData: String(source.missingData || ""),
    kitchenNote: String(source.kitchenNote || ""),
    deviationKind: (FRANCHISE_SHOP_DEVIATION_KINDS as readonly string[]).includes(kind)
      ? (kind as FranchiseShopDeviationKind)
      : "",
    deviationNote: String(source.deviationNote || ""),
    naleveringNote: String(source.naleveringNote || ""),
    receivedComplete: source.receivedComplete === true ? true : source.receivedComplete === false ? false : null,
    stockUpdatedAt: source.stockUpdatedAt ? String(source.stockUpdatedAt) : null,
    events
  };
}

const ACTION_BY_STATUS: Record<FranchiseShopOrderStatus, FranchiseShopOrderActionDef[]> = {
  registratie_onvolledig: [
    {
      id: "request_missing_data",
      label: "Vraag ontbrekende gegevens op",
      description: "Stuur de vestiging wat er nog ontbreekt en blijf in registratie onvolledig.",
      toStatus: "registratie_onvolledig",
      stay: true,
      tone: "no",
      noteLabel: "Ontbrekende gegevens",
      noteRequired: true,
      notify: true
    },
    {
      id: "complete_registration",
      label: "Registratie is compleet",
      description: "Alle gegevens staan erin. De productiekeuken kan controleren.",
      toStatus: "in_afwachting",
      tone: "yes"
    }
  ],
  in_afwachting: [
    {
      id: "confirm_order",
      label: "Bestelling bevestigen",
      description: "De productiekeuken keurt de bestelling goed.",
      toStatus: "bevestigd",
      tone: "yes",
      notify: true
    },
    {
      id: "require_action",
      label: "Actie vereist",
      description: "Stem een wijziging, tekort of alternatief af met de vestiging.",
      toStatus: "actie_vereist",
      tone: "no",
      noteLabel: "Wijziging, tekort of alternatief",
      noteRequired: true,
      notify: true
    },
    {
      id: "mark_incomplete",
      label: "Registratie onvolledig",
      description: "Er ontbreken nog gegevens voordat de keuken kan bevestigen.",
      toStatus: "registratie_onvolledig",
      tone: "neutral",
      noteLabel: "Wat ontbreekt er?"
    }
  ],
  actie_vereist: [
    {
      id: "resolve_action",
      label: "Afgestemd, opnieuw controleren",
      description: "Terug naar de productiekeuken voor een nieuwe check.",
      toStatus: "in_afwachting",
      tone: "yes",
      noteLabel: "Afspraak"
    }
  ],
  bevestigd: [
    {
      id: "start_processing",
      label: "Start behandeling",
      description: "Producten produceren of verzamelen.",
      toStatus: "in_behandeling",
      tone: "next"
    }
  ],
  in_behandeling: [
    {
      id: "mark_ready",
      label: "Gereed voor verzending",
      description: "Alles is geproduceerd of verzameld.",
      toStatus: "gereed_voor_verzending",
      tone: "next"
    }
  ],
  gereed_voor_verzending: [
    {
      id: "mark_shipped",
      label: "Onderweg zetten",
      description: "De levering is vertrokken naar de vestiging.",
      toStatus: "onderweg",
      tone: "next",
      notify: true
    }
  ],
  onderweg: [
    {
      id: "mark_arrived",
      label: "Vestiging ontvangt levering",
      description: "Start de controle bij ontvangst.",
      toStatus: "controle_bij_ontvangst",
      tone: "next"
    }
  ],
  controle_bij_ontvangst: [
    {
      id: "confirm_complete_receipt",
      label: "Volledige ontvangst bevestigen",
      description: "Levering is compleet en correct.",
      toStatus: "afgerond",
      tone: "yes"
    },
    {
      id: "report_deviation",
      label: "Afwijking registreren",
      description: "Registreer tekort, schade of fout.",
      toStatus: "afwijking",
      tone: "no",
      extra: "deviation",
      noteLabel: "Toelichting",
      noteRequired: true
    }
  ],
  afwijking: [
    {
      id: "plan_nalevering",
      label: "Nalevering plannen",
      description: "Plan een correctie of nalevering.",
      toStatus: "nalevering_gepland",
      tone: "yes",
      extra: "nalevering",
      noteLabel: "Nalevering",
      noteRequired: true
    },
    {
      id: "accept_with_deviation",
      label: "Ontvangst met afwijking",
      description: "Geen nalevering nodig. Werk bestelling en voorraad bij.",
      toStatus: "afgerond",
      tone: "no"
    }
  ],
  nalevering_gepland: [
    {
      id: "process_nalevering",
      label: "Nalevering verwerken",
      description: "Terug naar ontvangstcontrole op de vestiging.",
      toStatus: "controle_bij_ontvangst",
      tone: "next"
    }
  ],
  afgerond: [
    {
      id: "update_stock",
      label: "Voorraad en prognose bijwerken",
      description: "Zet in de CMS dat tellingen/prognose zijn meegenomen. Tellingen zelf staan onder Tellingen.",
      toStatus: "afgerond",
      stay: true,
      tone: "next",
      extra: "stock",
      noteLabel: "Toelichting voorraad"
    }
  ],
  geannuleerd: []
};

export function franchiseShopOrderActions(status: FranchiseShopOrderStatus): FranchiseShopOrderActionDef[] {
  const actions = [...(ACTION_BY_STATUS[status] || [])];
  if (
    status !== "afgerond" &&
    status !== "geannuleerd" &&
    status !== "onderweg" &&
    status !== "controle_bij_ontvangst" &&
    status !== "afwijking" &&
    status !== "nalevering_gepland"
  ) {
    actions.push({
      id: "cancel",
      label: "Annuleren",
      description: "Bestelling stopzetten.",
      toStatus: "geannuleerd",
      tone: "danger"
    });
  }
  return actions;
}

export function franchiseShopOrderActionDef(
  status: FranchiseShopOrderStatus,
  action: string
): FranchiseShopOrderActionDef | undefined {
  return franchiseShopOrderActions(status).find((item) => item.id === action);
}

export function franchiseShopOrderQuestion(status: FranchiseShopOrderStatus): string {
  switch (status) {
    case "registratie_onvolledig":
      return "Is de bestelling volledig geregistreerd?";
    case "in_afwachting":
      return "Heeft de productiekeuken de bestelling bevestigd?";
    case "actie_vereist":
      return "Is de wijziging, het tekort of het alternatief afgestemd?";
    case "bevestigd":
      return "Klaar om producten te produceren of te verzamelen?";
    case "in_behandeling":
      return "Zijn de producten gereed voor verzending?";
    case "gereed_voor_verzending":
      return "Is de levering onderweg?";
    case "onderweg":
      return "Heeft de vestiging de levering ontvangen?";
    case "controle_bij_ontvangst":
      return "Is de levering compleet en correct?";
    case "afwijking":
      return "Is nalevering nodig?";
    case "nalevering_gepland":
      return "Is de nalevering verwerkt?";
    case "afgerond":
      return "Voorraad en prognose bijwerken?";
    default:
      return "Deze bestelling is geannuleerd.";
  }
}

export interface FranchiseAccount {
  id: string;
  email: string;
  name: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  company: string;
  vatId: string;
  kvk: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFranchiseAccountInput {
  email: string;
  name: string;
  password: string;
  locationId: string;
  company?: string;
  vatId?: string;
  kvk?: string;
  active?: boolean;
}

export interface UpdateFranchiseAccountInput {
  email?: string;
  name?: string;
  password?: string;
  locationId?: string;
  company?: string;
  vatId?: string;
  kvk?: string;
  active?: boolean;
}

export interface FranchiseShopProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  sku: string;
  active: boolean;
  sortOrder: number;
  /** priceCents per locationId */
  prices: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFranchiseShopProductInput {
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  active?: boolean;
  prices?: Record<string, number>;
}

export interface UpdateFranchiseShopProductInput {
  name?: string;
  description?: string;
  image?: string;
  sku?: string;
  active?: boolean;
  sortOrder?: number;
  prices?: Record<string, number>;
}

export interface FranchiseShopOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface FranchiseShopOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: FranchiseShopOrderStatus;
  channel: FranchiseShopOrderChannel;
  accountId: string;
  accountName: string;
  accountEmail: string;
  accountCompany: string;
  accountVatId: string;
  accountKvk: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  notes: string;
  adminNotes: string;
  subtotalCents: number;
  items: FranchiseShopOrderItem[];
  flow: FranchiseShopOrderFlow;
  nextActions: FranchiseShopOrderActionDef[];
  question: string;
}

export interface CreateFranchiseShopOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
}

export interface AdminCreateFranchiseShopOrderInput {
  accountId: string;
  channel?: FranchiseShopOrderChannel;
  notes?: string;
  incomplete?: boolean;
  missingData?: string;
  items?: Array<{ productId: string; quantity: number }>;
}

export interface ApplyFranchiseShopOrderActionInput {
  action: FranchiseShopOrderAction;
  note?: string;
  deviationKind?: FranchiseShopDeviationKind | "";
  notify?: boolean;
}

export interface UpdateFranchiseShopOrderInput {
  status?: FranchiseShopOrderStatus;
  adminNotes?: string;
  items?: Array<{ productId: string; quantity: number }>;
}

export interface FranchiseShopCatalogProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  sku: string;
  priceCents: number;
}

export interface FranchiseShopSessionUser {
  id: string;
  name: string;
  email: string;
  locationId: string;
  locationName: string;
  locationCode: string;
}

export interface FranchiseShopLoginResponse {
  token: string;
  user: FranchiseShopSessionUser;
}

