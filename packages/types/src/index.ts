export type ApplicationRole = "Crew member - Kitchen" | "Service - Front" | "Runner - Delivery";

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

export interface SiteSettings {
  seo: {
    title: string;
    description: string;
    menuTitle: string;
    menuDescription: string;
    image: string;
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
}

export interface SiteContent {
  site: SiteSettings;
  videos: Video[];
  menu: MenuCategory[];
  locations: Location[];
}

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

export const APPLICATION_ROLES: ApplicationRole[] = [
  "Crew member - Kitchen",
  "Service - Front",
  "Runner - Delivery"
];

export const WEEK_DAYS: WeekDay[] = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag"
];
