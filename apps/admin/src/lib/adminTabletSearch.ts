import { CATERING_NAV_SECTIONS } from "../components/catering/cateringNav";
import type { CateringView } from "../components/catering/cateringNav";

export type AdminSearchTarget =
  | { kind: "tab"; tabId: string }
  | { kind: "catering"; view: CateringView };

export interface AdminSearchItem {
  id: string;
  label: string;
  group: string;
  description?: string;
  searchText: string;
  target: AdminSearchTarget;
}

export function buildAdminSearchItems(visibleTabs: ReadonlyArray<readonly [string, string]>): AdminSearchItem[] {
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
