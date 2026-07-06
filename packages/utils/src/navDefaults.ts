import type { NavItemConfig, NavItemId, NavSettings } from "@tresamigos/types";
import { NAV_ITEM_IDS, NAV_MAIN_ITEM_IDS, NAV_UTILITY_ITEM_IDS } from "@tresamigos/types";

export const NAV_ITEM_PATHS: Record<NavItemId, string> = {
  menu: "/menu",
  catering: "/catering",
  locations: "/locations",
  ourStory: "/our-story",
  ourValue: "/our-value",
  vacancy: "/vacancy",
  contact: "/contact",
  findTresAmigos: "/locations",
  login: "/login"
};

export const NAV_ITEM_I18N_KEYS: Record<NavItemId, string> = {
  menu: "nav.menu",
  catering: "nav.catering",
  locations: "nav.locations",
  ourStory: "nav.ourStory",
  ourValue: "nav.ourValue",
  vacancy: "nav.vacancy",
  contact: "nav.contact",
  findTresAmigos: "nav.findTresAmigos",
  login: "nav.login"
};

export const DEFAULT_NAV_SETTINGS: NavSettings = {
  items: [
    ...NAV_MAIN_ITEM_IDS.map((id, index) => ({
      id,
      visible: true,
      sortOrder: index,
      group: "main" as const
    })),
    ...NAV_UTILITY_ITEM_IDS.map((id, index) => ({
      id,
      visible: true,
      sortOrder: index,
      group: "utility" as const
    }))
  ]
};

function isNavItemId(value: unknown): value is NavItemId {
  return typeof value === "string" && NAV_ITEM_IDS.includes(value as NavItemId);
}

export function sanitizeNavSettings(input: unknown): NavSettings {
  const raw = input && typeof input === "object" ? (input as Partial<NavSettings>) : {};
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item, index) => {
          if (!item || typeof item !== "object") return null;
          const id = isNavItemId(item.id) ? item.id : null;
          if (!id) return null;
          const group = NAV_MAIN_ITEM_IDS.includes(id as (typeof NAV_MAIN_ITEM_IDS)[number]) ? "main" : "utility";
          return {
            id,
            visible: item.visible !== false,
            sortOrder: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : index,
            group
          } satisfies NavItemConfig;
        })
        .filter((item): item is NavItemConfig => Boolean(item))
    : [];

  const byId = new Map<NavItemId, NavItemConfig>();
  for (const item of items) {
    byId.set(item.id, item);
  }

  const merged: NavItemConfig[] = [];
  for (const defaults of DEFAULT_NAV_SETTINGS.items) {
    merged.push(byId.get(defaults.id) || defaults);
  }

  const main = merged.filter((item) => item.group === "main").sort((a, b) => a.sortOrder - b.sortOrder);
  const utility = merged.filter((item) => item.group === "utility").sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    items: [
      ...main.map((item, index) => ({ ...item, sortOrder: index })),
      ...utility.map((item, index) => ({ ...item, sortOrder: index }))
    ]
  };
}

export function getVisibleNavItems(settings: NavSettings, group: "main" | "utility"): NavItemConfig[] {
  return [...settings.items]
    .filter((item) => item.group === group && item.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
