import { useMemo, useState } from "react";
import {
  CATERING_INGREDIENT_GROUP_LABELS,
  CATERING_INGREDIENT_GROUPS,
  type CateringIngredientConfig,
  type CateringIngredientGroup,
  type CateringSettings
} from "@tresamigos/types";
import { createSlugId } from "../../lib/id";
import { mediaAssetUrl } from "../../lib/media";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "../AdminListUi";
import { FormSaveBar } from "../FormSaveBar";
import { MediaField } from "../MediaPickerModal";
import { localizedLabel, LocalizedTextFields, useCateringSettingsSave, type CateringSettingsPanelProps } from "./CateringSettingsUi";

function emptyIngredient(group: CateringIngredientGroup = "protein"): CateringIngredientConfig {
  const label = { nl: "Nieuw ingrediënt", en: "New ingredient" };
  return {
    id: createSlugId(label.nl, group),
    group,
    label,
    image: "/assets/brand/breakfast-lunch-dinner.png",
    active: true,
    sortOrder: 99
  };
}

export function CateringIngredientsPanel({ settings, onSettingsChange, saving }: CateringSettingsPanelProps) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { save, message, localSaving } = useCateringSettingsSave(settings, onSettingsChange);

  const groupOptions = useMemo(
    () => [
      { value: "all", label: "Alle groepen" },
      ...CATERING_INGREDIENT_GROUPS.map((group) => ({ value: group, label: CATERING_INGREDIENT_GROUP_LABELS[group] }))
    ],
    []
  );

  const ingredients = useMemo(
    () =>
      [...settings.ingredients].sort(
        (a, b) => a.group.localeCompare(b.group) || a.sortOrder - b.sortOrder || localizedLabel(a.label).localeCompare(localizedLabel(b.label))
      ),
    [settings.ingredients]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      if (groupFilter !== "all" && ingredient.group !== groupFilter) return false;
      if (!normalized) return true;
      return `${localizedLabel(ingredient.label)} ${ingredient.group} ${ingredient.id}`.toLowerCase().includes(normalized);
    });
  }, [ingredients, query, groupFilter]);

  const selected = ingredients.find((ingredient) => ingredient.id === selectedId) || null;

  function updateIngredient(id: string, patch: Partial<CateringIngredientConfig>) {
    onSettingsChange({
      ...settings,
      ingredients: settings.ingredients.map((ingredient) => (ingredient.id === id ? { ...ingredient, ...patch } : ingredient))
    });
  }

  function addIngredient() {
    const group = groupFilter === "all" ? "protein" : (groupFilter as CateringIngredientGroup);
    const ingredient = emptyIngredient(group);
    onSettingsChange({ ...settings, ingredients: [...settings.ingredients, ingredient] });
    setSelectedId(ingredient.id);
  }

  function removeIngredient(id: string) {
    onSettingsChange({ ...settings, ingredients: settings.ingredients.filter((ingredient) => ingredient.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="catering-settings-page">
      <header className="catering-settings-head">
        <h3>Ingrediënten</h3>
        <p className="ta-seo-hint">
          Stel eiwitten, toppings, sauzen en andere keuzes in met foto. Deze opties verschijnen in de cateringconfigurator op de website.
        </p>
      </header>

      <div className="ta-master-detail">
        <div className="ta-list-pane">
          <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek ingrediënt..." label="Ingrediënten zoeken" />
          <AdminFilterChips value={groupFilter} onChange={setGroupFilter} options={groupOptions} />
          <div className="ta-toolbar ta-toolbar-spread">
            <p className="ta-seo-hint" style={{ margin: 0 }}>
              {filtered.length} ingrediënt(en)
            </p>
            <button className="ta-btn ta-btn-primary" type="button" onClick={addIngredient}>
              + Nieuw ingrediënt
            </button>
          </div>
          <div className="ta-list-scroll">
            {filtered.length ? (
              filtered.map((ingredient) => (
                <AdminListRow
                  key={ingredient.id}
                  title={localizedLabel(ingredient.label)}
                  meta={CATERING_INGREDIENT_GROUP_LABELS[ingredient.group]}
                  thumb={mediaAssetUrl(ingredient.image)}
                  badge={ingredient.active ? "Actief" : "Uit"}
                  badgeClassName={ingredient.active ? "catering-status-afgerond" : "catering-status-geannuleerd"}
                  active={ingredient.id === selectedId}
                  onClick={() => setSelectedId(ingredient.id)}
                />
              ))
            ) : (
              <div className="ta-empty">Geen ingrediënten gevonden.</div>
            )}
          </div>
        </div>

        {selected ? (
          <div className="ta-detail-pane ta-fade-in" key={selected.id}>
            <div className="catering-ingredient-preview">
              <img src={mediaAssetUrl(selected.image)} alt={localizedLabel(selected.label)} />
              <div>
                <p className="eyebrow">{CATERING_INGREDIENT_GROUP_LABELS[selected.group]}</p>
                <h4>{localizedLabel(selected.label)}</h4>
              </div>
            </div>

            <LocalizedTextFields label="Naam" value={selected.label} onChange={(label) => updateIngredient(selected.id, { label })} />

            <div className="ta-grid">
              <label className="ta-field">
                <span>Groep</span>
                <select
                  value={selected.group}
                  onChange={(event) => updateIngredient(selected.id, { group: event.target.value as CateringIngredientGroup })}
                >
                  {CATERING_INGREDIENT_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {CATERING_INGREDIENT_GROUP_LABELS[group]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ta-field">
                <span>Status</span>
                <select
                  value={selected.active ? "yes" : "no"}
                  onChange={(event) => updateIngredient(selected.id, { active: event.target.value === "yes" })}
                >
                  <option value="yes">Actief</option>
                  <option value="no">Uitgeschakeld</option>
                </select>
              </label>
              <label className="ta-field">
                <span>Sortering</span>
                <input
                  type="number"
                  min={0}
                  value={selected.sortOrder}
                  onChange={(event) => updateIngredient(selected.id, { sortOrder: Number(event.target.value) || 0 })}
                />
              </label>
              <div className="ta-field ta-grid-wide">
                <MediaField
                  label="Afbeelding"
                  value={selected.image}
                  onChange={(image) => updateIngredient(selected.id, { image })}
                />
              </div>
            </div>

            <div className="ta-toolbar" style={{ marginTop: 12 }}>
              <button className="ta-btn ta-btn-danger" type="button" onClick={() => removeIngredient(selected.id)}>
                Ingrediënt verwijderen
              </button>
            </div>
          </div>
        ) : (
          <div className="ta-detail-pane ta-empty">
            <strong>Kies een ingrediënt</strong>
            <p>Of voeg een nieuwe keuze toe voor de cateringconfigurator.</p>
          </div>
        )}
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void save()} saving={saving || localSaving} />
    </div>
  );
}
