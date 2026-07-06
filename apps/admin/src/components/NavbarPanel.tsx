import type { NavItemConfig, NavItemId, NavSettings, SiteContent } from "@tresamigos/types";
import { NAV_ITEM_ADMIN_LABELS } from "@tresamigos/types";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";

function updateSite(content: SiteContent, patch: Partial<SiteContent["site"]>) {
  return { ...content, site: { ...content.site, ...patch } };
}

function NavItemList({
  title,
  hint,
  group,
  items,
  onChange
}: {
  title: string;
  hint: string;
  group: "main" | "utility";
  items: NavItemConfig[];
  onChange: (items: NavItemConfig[]) => void;
}) {
  const groupItems = [...items].filter((item) => item.group === group).sort((a, b) => a.sortOrder - b.sortOrder);

  function updateItem(id: NavItemId, patch: Partial<NavItemConfig>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function moveItem(id: NavItemId, direction: -1 | 1) {
    const sorted = [...groupItems];
    const index = sorted.findIndex((item) => item.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;
    const next = sorted.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    const reordered = next.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }));
    const other = items.filter((item) => item.group !== group);
    onChange([...other, ...reordered]);
  }

  return (
    <section className="catering-settings-page" style={{ marginTop: 18 }}>
      <header className="catering-settings-head">
        <h3>{title}</h3>
        <p className="ta-seo-hint">{hint}</p>
      </header>

      <div className="catering-category-list">
        {groupItems.map((item, index) => (
          <article key={item.id} className="catering-category-card">
            <div className="catering-category-card-head">
              <strong>{NAV_ITEM_ADMIN_LABELS[item.id]}</strong>
              <div className="catering-category-card-actions">
                <button className="ta-btn ta-btn-ghost" type="button" disabled={index === 0} onClick={() => moveItem(item.id, -1)}>
                  ↑
                </button>
                <button
                  className="ta-btn ta-btn-ghost"
                  type="button"
                  disabled={index === groupItems.length - 1}
                  onClick={() => moveItem(item.id, 1)}
                >
                  ↓
                </button>
              </div>
            </div>
            <label className="ta-field">
              <span>Zichtbaar in navbar</span>
              <select
                value={item.visible ? "yes" : "no"}
                onChange={(event) => updateItem(item.id, { visible: event.target.value === "yes" })}
              >
                <option value="yes">Zichtbaar</option>
                <option value="no">Verborgen</option>
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}

export function NavbarPanel({
  content,
  onChange,
  onSave,
  saving
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
} & PanelSaveProps) {
  const navigation = content.site.navigation;

  function updateNavigation(next: NavSettings) {
    onChange(updateSite(content, { navigation: next }));
  }

  return (
    <div className="ta-stack-panel">
      <p className="ta-seo-hint">
        Bepaal welke menu-items zichtbaar zijn op de website en in welke volgorde — net als bij Shopify. Wijzigingen zijn direct zichtbaar na opslaan.
      </p>

      <NavItemList
        title="Hoofdmenu"
        hint="De paginalinks in de navbar (desktop en mobiel menu)."
        group="main"
        items={navigation.items}
        onChange={(items) => updateNavigation({ ...navigation, items })}
      />

      <NavItemList
        title="Extra knoppen"
        hint="Vind je Tres Amigos en Inloggen rechtsboven (en in het mobiele menu)."
        group="utility"
        items={navigation.items}
        onChange={(items) => updateNavigation({ ...navigation, items })}
      />

      <FormSaveBar onSave={onSave} saving={saving} />
    </div>
  );
}
