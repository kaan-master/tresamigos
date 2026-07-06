import { useMemo, useState } from "react";
import type { CateringCategoryId, CateringPackageTier, CateringProductConfig, CateringSettings } from "@tresamigos/types";
import { createSlugId } from "../../lib/id";
import { mediaAssetUrl } from "../../lib/media";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "../AdminListUi";
import { FormSaveBar } from "../FormSaveBar";
import { MediaField } from "../MediaPickerModal";
import { localizedLabel, LocalizedTextFields, useCateringSettingsSave, type CateringSettingsPanelProps } from "./CateringSettingsUi";

const TIER_OPTIONS: CateringPackageTier[] = ["budget", "single", "double", "triple"];
const DEFAULT_SERVINGS = [10, 15, 20, 25, 30];

function emptyProduct(categoryId: CateringCategoryId = "buffet"): CateringProductConfig {
  const name = { nl: "Nieuw cateringproduct", en: "New catering product" };
  return {
    id: createSlugId(name.nl, categoryId),
    categoryId,
    name,
    description: { nl: "", en: "" },
    image: "assets/brand/breakfast-lunch-dinner.png",
    basePriceCents: 0,
    active: true,
    sortOrder: 99,
    minServings: 10,
    maxServings: 30,
    configurable: categoryId === "buffet" || categoryId === "burrito",
    tier: categoryId === "buffet" || categoryId === "burrito" ? "single" : undefined,
    servingOptions: DEFAULT_SERVINGS.map((servings) => ({ servings, extraCents: 0 }))
  };
}

function formatEuroInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseEuroInput(value: string) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function CateringProductsPanel({ settings, onSettingsChange, saving }: CateringSettingsPanelProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { save, message, localSaving } = useCateringSettingsSave(settings, onSettingsChange);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Alle categorieën" },
      ...[...settings.categories]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => ({ value: category.id, label: localizedLabel(category.label) }))
    ],
    [settings.categories]
  );

  const products = useMemo(
    () => [...settings.products].sort((a, b) => a.sortOrder - b.sortOrder || localizedLabel(a.name).localeCompare(localizedLabel(b.name))),
    [settings.products]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) return false;
      if (!normalized) return true;
      return `${localizedLabel(product.name)} ${localizedLabel(product.description)} ${product.categoryId}`.toLowerCase().includes(normalized);
    });
  }, [products, query, categoryFilter]);

  const selected = products.find((product) => product.id === selectedId) || null;

  function updateProduct(productId: string, patch: Partial<CateringProductConfig>) {
    onSettingsChange({
      ...settings,
      products: settings.products.map((product) => (product.id === productId ? { ...product, ...patch } : product))
    });
  }

  function updateServingOption(productId: string, servings: number, extraCents: number) {
    const product = settings.products.find((item) => item.id === productId);
    if (!product) return;
    const servingOptions = product.servingOptions.some((option) => option.servings === servings)
      ? product.servingOptions.map((option) => (option.servings === servings ? { ...option, extraCents } : option))
      : [...product.servingOptions, { servings, extraCents }].sort((a, b) => a.servings - b.servings);
    updateProduct(productId, { servingOptions });
  }

  function addProduct() {
    const categoryId = categoryFilter === "all" ? "buffet" : (categoryFilter as CateringCategoryId);
    const product = emptyProduct(categoryId);
    onSettingsChange({ ...settings, products: [...settings.products, product] });
    setSelectedId(product.id);
  }

  function removeProduct(productId: string) {
    onSettingsChange({ ...settings, products: settings.products.filter((product) => product.id !== productId) });
    if (selectedId === productId) setSelectedId(null);
  }

  return (
    <div className="catering-settings-page">
      <header className="catering-settings-head">
        <h3>Producten</h3>
        <p className="ta-seo-hint">Beheer cateringproducten, prijzen en personen-aantallen voor de webshop (NL/EN).</p>
      </header>

      <div className="ta-master-detail">
        <div className="ta-list-pane">
          <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek product..." label="Producten zoeken" />
          <AdminFilterChips value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} />
          <div className="ta-toolbar ta-toolbar-spread">
            <p className="ta-seo-hint" style={{ margin: 0 }}>
              {filtered.length} product(en)
            </p>
            <button className="ta-btn ta-btn-primary" type="button" onClick={addProduct}>
              + Nieuw product
            </button>
          </div>
          <div className="ta-list-scroll">
            {filtered.length ? (
              filtered.map((product) => (
                <AdminListRow
                  key={product.id}
                  title={localizedLabel(product.name)}
                  meta={`${localizedLabel(settings.categories.find((c) => c.id === product.categoryId)?.label || { nl: product.categoryId, en: product.categoryId })} · € ${formatEuroInput(product.basePriceCents)}`}
                  thumb={mediaAssetUrl(product.image)}
                  badge={product.active ? "Actief" : "Uit"}
                  badgeClassName={product.active ? "catering-status-afgerond" : "catering-status-geannuleerd"}
                  active={product.id === selectedId}
                  onClick={() => setSelectedId(product.id)}
                />
              ))
            ) : (
              <div className="ta-empty">Geen producten gevonden.</div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="ta-detail-pane ta-fade-in" key={selected.id}>
            <LocalizedTextFields label="Naam" value={selected.name} onChange={(name) => updateProduct(selected.id, { name })} />
            <LocalizedTextFields
              label="Omschrijving"
              value={selected.description}
              onChange={(description) => updateProduct(selected.id, { description })}
            />
            <div className="ta-grid">
              <label className="ta-field">
                <span>Categorie</span>
                <select
                  value={selected.categoryId}
                  onChange={(event) => updateProduct(selected.id, { categoryId: event.target.value as CateringCategoryId })}
                >
                  {settings.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {localizedLabel(category.label)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ta-field">
                <span>Basisprijs (€)</span>
                <input
                  value={formatEuroInput(selected.basePriceCents)}
                  onChange={(event) => updateProduct(selected.id, { basePriceCents: parseEuroInput(event.target.value) })}
                />
              </label>
              <label className="ta-field">
                <span>Min. personen</span>
                <input
                  type="number"
                  min={1}
                  value={selected.minServings}
                  onChange={(event) => updateProduct(selected.id, { minServings: Number(event.target.value) || 1 })}
                />
              </label>
              <label className="ta-field">
                <span>Max. personen</span>
                <input
                  type="number"
                  min={1}
                  value={selected.maxServings}
                  onChange={(event) => updateProduct(selected.id, { maxServings: Number(event.target.value) || 30 })}
                />
              </label>
              <label className="ta-field">
                <span>Sortering</span>
                <input
                  type="number"
                  min={0}
                  value={selected.sortOrder}
                  onChange={(event) => updateProduct(selected.id, { sortOrder: Number(event.target.value) || 0 })}
                />
              </label>
              <label className="ta-field">
                <span>Status</span>
                <select
                  value={selected.active ? "yes" : "no"}
                  onChange={(event) => updateProduct(selected.id, { active: event.target.value === "yes" })}
                >
                  <option value="yes">Actief</option>
                  <option value="no">Uitgeschakeld</option>
                </select>
              </label>
              <label className="ta-field">
                <span>Configureerbaar</span>
                <select
                  value={selected.configurable ? "yes" : "no"}
                  onChange={(event) => {
                    const configurable = event.target.value === "yes";
                    updateProduct(selected.id, {
                      configurable,
                      tier: configurable ? selected.tier || "single" : undefined,
                      servingOptions: configurable
                        ? selected.servingOptions.length
                          ? selected.servingOptions
                          : DEFAULT_SERVINGS.map((servings) => ({ servings, extraCents: 0 }))
                        : []
                    });
                  }}
                >
                  <option value="yes">Ja</option>
                  <option value="no">Nee</option>
                </select>
              </label>
              {selected.configurable ? (
                <label className="ta-field">
                  <span>Pakkettype</span>
                  <select
                    value={selected.tier || "single"}
                    onChange={(event) => updateProduct(selected.id, { tier: event.target.value as CateringPackageTier })}
                  >
                    {TIER_OPTIONS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="ta-field ta-grid-wide">
                <MediaField label="Afbeelding" value={selected.image} onChange={(image) => updateProduct(selected.id, { image })} />
              </div>
            </div>

            {selected.configurable ? (
              <section className="catering-admin-section">
                <h4>Meerprijs per aantal personen</h4>
                <div className="catering-serving-table">
                  {DEFAULT_SERVINGS.map((servings) => {
                    const option = selected.servingOptions.find((row) => row.servings === servings);
                    return (
                      <label key={servings} className="catering-serving-row">
                        <span>{servings} personen</span>
                        <input
                          value={formatEuroInput(option?.extraCents || 0)}
                          onChange={(event) => updateServingOption(selected.id, servings, parseEuroInput(event.target.value))}
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <div className="ta-toolbar" style={{ marginTop: 12 }}>
              <button className="ta-btn ta-btn-danger" type="button" onClick={() => removeProduct(selected.id)}>
                Product verwijderen
              </button>
            </div>
          </div>
        ) : (
          <div className="ta-detail-pane ta-empty">
            <strong>Kies een product</strong>
            <p>Of voeg een nieuw cateringproduct toe.</p>
          </div>
        )}
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void save()} saving={saving || localSaving} />
    </div>
  );
}
