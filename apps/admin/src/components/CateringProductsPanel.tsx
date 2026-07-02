import { useMemo, useState } from "react";
import type { CateringCategoryId, CateringPackageTier, CateringProductConfig, CateringSettings } from "@tresamigos/types";
import { api } from "../lib/api";
import { createSlugId } from "../lib/id";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "./AdminListUi";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { MediaField } from "./MediaPickerModal";

interface Props extends PanelSaveProps {
  settings: CateringSettings;
  onSettingsChange: (settings: CateringSettings) => void;
}

const CATEGORY_OPTIONS: { value: CateringCategoryId | "all"; label: string }[] = [
  { value: "all", label: "Alle categorieën" },
  { value: "buffet", label: "Buffet" },
  { value: "burrito", label: "Burrito" },
  { value: "drinks", label: "Drinken" },
  { value: "sauces", label: "Sauzen" },
  { value: "team-thanks", label: "Team bedankje" }
];

const TIER_OPTIONS: CateringPackageTier[] = ["budget", "single", "double", "triple"];
const DEFAULT_SERVINGS = [10, 15, 20, 25, 30];

function emptyProduct(categoryId: CateringCategoryId = "buffet"): CateringProductConfig {
  const name = "Nieuw cateringproduct";
  return {
    id: createSlugId(name, categoryId),
    categoryId,
    name,
    description: "",
    image: "/assets/brand/breakfast-lunch-dinner.png",
    basePriceCents: 0,
    active: true,
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

export function CateringProductsPanel({ settings, onSettingsChange, onSave, saving }: Props) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [localSaving, setLocalSaving] = useState(false);

  const products = settings.products;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) return false;
      if (!normalized) return true;
      return `${product.name} ${product.description} ${product.categoryId}`.toLowerCase().includes(normalized);
    });
  }, [products, query, categoryFilter]);

  const selected = products.find((product) => product.id === selectedId) || null;

  function updateSettings(next: CateringSettings) {
    onSettingsChange(next);
    setMessage("");
  }

  function updateProduct(productId: string, patch: Partial<CateringProductConfig>) {
    updateSettings({
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
    updateSettings({ ...settings, products: [...settings.products, product] });
    setSelectedId(product.id);
  }

  function removeProduct(productId: string) {
    updateSettings({ ...settings, products: settings.products.filter((product) => product.id !== productId) });
    if (selectedId === productId) setSelectedId(null);
  }

  async function saveSettings() {
    setLocalSaving(true);
    setMessage("");
    try {
      const saved = await api<CateringSettings>("/api/admin/catering/settings", {
        method: "PUT",
        body: JSON.stringify(settings)
      });
      onSettingsChange(saved);
      setMessage("Cateringproducten opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setLocalSaving(false);
    }
  }

  return (
    <div className="catering-products-layout">
      <section className="catering-admin-settings-card">
        <h3>Algemene instellingen</h3>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Max. personen online</span>
            <input
              type="number"
              min={1}
              max={500}
              value={settings.maxOnlineServings}
              onChange={(event) =>
                updateSettings({ ...settings, maxOnlineServings: Number(event.target.value) || 30 })
              }
            />
          </label>
          <label className="ta-field">
            <span>E-mail grote groepen</span>
            <input
              type="email"
              value={settings.largeGroupEmail}
              onChange={(event) => updateSettings({ ...settings, largeGroupEmail: event.target.value })}
            />
          </label>
        </div>
      </section>

      <div className="ta-master-detail">
        <div className="ta-list-pane">
          <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek product..." label="Producten zoeken" />
          <AdminFilterChips
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />
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
                  title={product.name}
                  meta={`${CATEGORY_OPTIONS.find((option) => option.value === product.categoryId)?.label || product.categoryId} · € ${formatEuroInput(product.basePriceCents)}${product.configurable ? " · configureerbaar" : ""}`}
                  badge={product.active ? "Actief" : "Uit"}
                  badgeClassName={product.active ? "catering-status-afgerond" : "catering-status-geannuleerd"}
                  active={product.id === selectedId}
                  onClick={() => setSelectedId(product.id)}
                />
              ))
            ) : (
              <div className="ta-empty">Nog geen producten in deze categorie.</div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="ta-detail-pane ta-fade-in" key={selected.id}>
            <h3 className="ta-section-title">{selected.name}</h3>
            <div className="ta-grid">
              <label className="ta-field">
                <span>Naam</span>
                <input value={selected.name} onChange={(event) => updateProduct(selected.id, { name: event.target.value })} />
              </label>
              <label className="ta-field">
                <span>Categorie</span>
                <select
                  value={selected.categoryId}
                  onChange={(event) => updateProduct(selected.id, { categoryId: event.target.value as CateringCategoryId })}
                >
                  {CATEGORY_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ta-field ta-grid-wide">
                <span>Omschrijving</span>
                <textarea
                  rows={3}
                  value={selected.description}
                  onChange={(event) => updateProduct(selected.id, { description: event.target.value })}
                />
              </label>
              <label className="ta-field">
                <span>Basisprijs (€)</span>
                <input
                  value={formatEuroInput(selected.basePriceCents)}
                  onChange={(event) => updateProduct(selected.id, { basePriceCents: parseEuroInput(event.target.value) })}
                />
              </label>
              <label className="ta-field">
                <span>Status</span>
                <select
                  value={selected.active ? "yes" : "no"}
                  onChange={(event) => updateProduct(selected.id, { active: event.target.value === "yes" })}
                >
                  <option value="yes">Actief in webshop</option>
                  <option value="no">Verborgen</option>
                </select>
              </label>
              <label className="ta-field">
                <span>Configureerbaar pakket</span>
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
                  <option value="yes">Ja — klant kiest samenstelling</option>
                  <option value="no">Nee — vaste prijs</option>
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
                <MediaField
                  label="Afbeelding"
                  value={selected.image}
                  onChange={(image) => updateProduct(selected.id, { image })}
                />
              </div>
            </div>

            {selected.configurable ? (
              <section className="catering-admin-section">
                <h4>Prijzen per aantal personen</h4>
                <p className="ta-seo-hint">Basisprijs geldt voor 10 personen. Vul per rij de meerprijs in voor grotere groepen.</p>
                <div className="catering-serving-table">
                  <div className="catering-serving-table-head">
                    <span>Personen</span>
                    <span>Meerprijs t.o.v. 10 personen</span>
                  </div>
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
            <p>Of voeg een nieuw cateringproduct toe voor de webshop.</p>
          </div>
        )}
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void saveSettings()} saving={saving || localSaving} />
    </div>
  );
}
