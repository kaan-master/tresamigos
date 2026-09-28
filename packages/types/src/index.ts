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
  "loyalty"
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
  loyalty: "Loyalty"
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
  "tellingen"
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
  tellingen: "Tellingen"
};

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  permissions: AdminTabId[];
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
}

export interface UpdateAdminUserInput {
  name?: string;
  password?: string;
  permissions?: AdminTabId[];
  active?: boolean;
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

export interface AnalyticsSnapshot {
  liveNow: number;
  viewsToday: number;
  viewsWeek: number;
  topPages: { path: string; views: number }[];
  dailyLog: AnalyticsDailyEntry[];
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
  notifications: IntegrationMailNotifications;
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

export interface IntegrationTestMailInput {
  to: string;
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
export const FRANCHISE_SHOP_ORDER_STATUSES = ["nieuw", "bevestigd", "verzonden", "afgerond", "geannuleerd"] as const;
export type FranchiseShopOrderStatus = (typeof FRANCHISE_SHOP_ORDER_STATUSES)[number];

export interface FranchiseAccount {
  id: string;
  email: string;
  name: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFranchiseAccountInput {
  email: string;
  name: string;
  password: string;
  locationId: string;
  active?: boolean;
}

export interface UpdateFranchiseAccountInput {
  email?: string;
  name?: string;
  password?: string;
  locationId?: string;
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
  accountId: string;
  accountName: string;
  accountEmail: string;
  locationId: string;
  locationName: string;
  locationCode: string;
  notes: string;
  adminNotes: string;
  subtotalCents: number;
  items: FranchiseShopOrderItem[];
}

export interface CreateFranchiseShopOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  notes?: string;
}

export interface UpdateFranchiseShopOrderInput {
  status?: FranchiseShopOrderStatus;
  adminNotes?: string;
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

