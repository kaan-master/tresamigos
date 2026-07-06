import type { CateringFormFieldConfig, CateringSettings } from "@tresamigos/types";
import { FormSaveBar } from "../FormSaveBar";
import { LocalizedTextFields, useCateringSettingsSave, type CateringSettingsPanelProps } from "./CateringSettingsUi";

export function CateringFormSettingsPanel({ settings, onSettingsChange, saving }: CateringSettingsPanelProps) {
  const { save, message, localSaving } = useCateringSettingsSave(settings, onSettingsChange);

  function updateField(id: string, patch: Partial<CateringFormFieldConfig>) {
    onSettingsChange({
      ...settings,
      formFields: settings.formFields.map((field) => (field.id === id ? { ...field, ...patch } : field))
    });
  }

  return (
    <div className="catering-settings-page">
      <header className="catering-settings-head">
        <h3>Formulierinstellingen</h3>
        <p className="ta-seo-hint">Bepaal welke velden klanten invullen bij checkout en welke verplicht zijn.</p>
      </header>

      <div className="catering-form-fields-list">
        {settings.formFields.map((field) => (
          <article key={field.id} className="catering-form-field-card">
            <strong>{field.id}</strong>
            <LocalizedTextFields label="Label" value={field.label} onChange={(label) => updateField(field.id, { label })} />
            <div className="ta-grid">
              <label className="ta-field">
                <span>Veld tonen</span>
                <select
                  value={field.enabled ? "yes" : "no"}
                  onChange={(event) => updateField(field.id, { enabled: event.target.value === "yes" })}
                >
                  <option value="yes">Ja</option>
                  <option value="no">Nee</option>
                </select>
              </label>
              <label className="ta-field">
                <span>Verplicht</span>
                <select
                  value={field.required ? "yes" : "no"}
                  onChange={(event) => updateField(field.id, { required: event.target.value === "yes" })}
                  disabled={!field.enabled}
                >
                  <option value="yes">Verplicht</option>
                  <option value="no">Optioneel</option>
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void save()} saving={saving || localSaving} />
    </div>
  );
}
