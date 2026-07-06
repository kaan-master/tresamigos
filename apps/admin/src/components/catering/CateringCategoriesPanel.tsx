import type { CateringCategoryConfig, CateringSettings } from "@tresamigos/types";
import { FormSaveBar } from "../FormSaveBar";
import { LocalizedTextFields, useCateringSettingsSave, type CateringSettingsPanelProps } from "./CateringSettingsUi";

export function CateringCategoriesPanel({ settings, onSettingsChange, saving }: CateringSettingsPanelProps) {
  const { save, message, localSaving } = useCateringSettingsSave(settings, onSettingsChange);

  const categories = [...settings.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  function updateCategory(id: string, patch: Partial<CateringCategoryConfig>) {
    onSettingsChange({
      ...settings,
      categories: settings.categories.map((category) => (category.id === id ? { ...category, ...patch } : category))
    });
  }

  function moveCategory(id: string, direction: -1 | 1) {
    const sorted = [...settings.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((category) => category.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;
    const next = sorted.map((category, categoryIndex) => ({ ...category, sortOrder: categoryIndex }));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onSettingsChange({
      ...settings,
      categories: next.map((category, categoryIndex) => ({ ...category, sortOrder: categoryIndex }))
    });
  }

  return (
    <div className="catering-settings-page">
      <header className="catering-settings-head">
        <h3>Pakketten / categorieën</h3>
        <p className="ta-seo-hint">Bepaal welke cateringcategorieën zichtbaar zijn in de webshop en in welke volgorde.</p>
      </header>

      <div className="catering-category-list">
        {categories.map((category, index) => (
          <article key={category.id} className="catering-category-card">
            <div className="catering-category-card-head">
              <strong>{category.id}</strong>
              <div className="catering-category-card-actions">
                <button className="ta-btn ta-btn-ghost" type="button" disabled={index === 0} onClick={() => moveCategory(category.id, -1)}>
                  ↑
                </button>
                <button
                  className="ta-btn ta-btn-ghost"
                  type="button"
                  disabled={index === categories.length - 1}
                  onClick={() => moveCategory(category.id, 1)}
                >
                  ↓
                </button>
              </div>
            </div>
            <LocalizedTextFields
              label="Naam categorie"
              value={category.label}
              onChange={(label) => updateCategory(category.id, { label })}
            />
            <label className="ta-field">
              <span>Zichtbaar in webshop</span>
              <select
                value={category.visible ? "yes" : "no"}
                onChange={(event) => updateCategory(category.id, { visible: event.target.value === "yes" })}
              >
                <option value="yes">Zichtbaar</option>
                <option value="no">Verborgen</option>
              </select>
            </label>
          </article>
        ))}
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void save()} saving={saving || localSaving} />
    </div>
  );
}
