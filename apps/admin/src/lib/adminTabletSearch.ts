import { CATERING_NAV_SECTIONS } from "../components/catering/cateringNav";
import type { CateringView } from "../components/catering/cateringNav";
import type { ApplicationsView } from "../components/ApplicationsPanel";
import type { SiteSettingsView } from "../components/SiteSettingsPanel";

export type AdminSearchTarget =
  | { kind: "tab"; tabId: string }
  | { kind: "catering"; view: CateringView }
  | { kind: "applications"; view: ApplicationsView }
  | { kind: "siteSettings"; view: SiteSettingsView };

export interface AdminSearchItem {
  id: string;
  label: string;
  group: string;
  description?: string;
  searchText: string;
  target: AdminSearchTarget;
}

export function buildAdminSearchItems(
  visibleTabs: ReadonlyArray<readonly [string, string]>,
  extras: { siteSettingViews: SiteSettingsView[]; hasApplications: boolean } = {
    siteSettingViews: [],
    hasApplications: false
  }
): AdminSearchItem[] {
  const items: AdminSearchItem[] = [];

  for (const [id, label] of visibleTabs) {
    items.push({
      id: `tab-${id}`,
      label,
      group: "Dashboard",
      description: "Hoofdonderdeel",
      searchText: `${label} dashboard`,
      target: { kind: "tab", tabId: id }
    });
  }

  for (const section of CATERING_NAV_SECTIONS) {
    for (const item of section.items) {
      items.push({
        id: `catering-${item.id}`,
        label: item.label,
        group: `Catering · ${section.label}`,
        description: item.description,
        searchText: `${item.label} ${item.description} catering ${section.label}`,
        target: { kind: "catering", view: item.id }
      });
    }
  }

  if (visibleTabs.some(([id]) => id === "tellingen")) {
    for (const [id, label] of [
      ["overview", "Telling-overzicht"],
      ["charts", "Telling-grafieken"],
      ["product-charts", "Telling-productgrafieken"],
      ["users", "Telling-gebruikers"],
      ["products", "Telling-producten"],
      ["export", "Telling-export"]
    ] as const) {
      items.push({
        id: `tellingen-${id}`,
        label,
        group: "Tellingen",
        description: "Voorraadtellingen",
        searchText: `${label} tellingen voorraad`,
        target: { kind: "tab", tabId: "tellingen" }
      });
    }
  }

  if (extras.hasApplications) {
    for (const [id, label, description] of [
      ["incoming", "Inkomende sollicitaties", "Filter sollicitaties"],
      ["jobs", "Vacature functies", "Functies beheren"],
      ["page", "Vacaturepagina", "Work With Us"]
    ] as const) {
      items.push({
        id: `applications-${id}`,
        label,
        group: "Sollicitaties",
        description,
        searchText: `${label} ${description} sollicitaties vacatures`,
        target: { kind: "applications", view: id }
      });
    }
  }

  const siteLabels: Record<SiteSettingsView, { label: string; description: string }> = {
    home: { label: "Home-tekst", description: "Hero, uren en paginatekst" },
    pageMedia: { label: "Pagina-foto's", description: "Alle pagina-afbeeldingen" },
    navigation: { label: "Menu", description: "Navbar-links en volgorde" },
    footer: { label: "Footer", description: "Footer, promo-mail en contact" },
    integrations: { label: "Koppelingen", description: "Google Ads, nieuwsbrief en mailrelay" },
    users: { label: "Gebruikers", description: "Accounts en rechten" }
  };

  for (const view of extras.siteSettingViews) {
    const copy = siteLabels[view];
    items.push({
      id: `site-${view}`,
      label: copy.label,
      group: "Website-instellingen",
      description: copy.description,
      searchText: `${copy.label} ${copy.description} website instellingen`,
      target: { kind: "siteSettings", view }
    });
  }

  return items;
}

export function filterSearchItems(items: AdminSearchItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.searchText.toLowerCase().includes(q)
  );
}
