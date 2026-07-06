import { FormSaveBar } from "../FormSaveBar";
import type { CateringFulfillmentModeSettings, CateringFulfillmentSettings } from "@tresamigos/types";
import { useCateringSettingsSave, type CateringSettingsPanelProps } from "./CateringSettingsUi";

function updateMode(
  settings: CateringFulfillmentSettings,
  mode: keyof CateringFulfillmentSettings,
  patch: Partial<CateringFulfillmentModeSettings>
): CateringFulfillmentSettings {
  return {
    ...settings,
    [mode]: { ...settings[mode], ...patch }
  };
}

export function CateringFulfillmentPanel({ settings, onSettingsChange, saving }: CateringSettingsPanelProps) {
  const { save, message, localSaving } = useCateringSettingsSave(settings, onSettingsChange);
  const fulfillment = settings.fulfillment;

  function patchFulfillment(next: CateringFulfillmentSettings) {
    onSettingsChange({ ...settings, fulfillment: next });
  }

  return (
    <div className="catering-settings-page">
      <header className="catering-settings-head">
        <h3>Afhalen & bezorgen</h3>
        <p className="ta-seo-hint">Bepaal welke afhandelingsopties klanten zien en binnen welke tijden bestellingen gepland mogen worden.</p>
      </header>

      {(["pickup", "delivery"] as const).map((mode) => {
        const config = fulfillment[mode];
        const title = mode === "pickup" ? "Afhalen" : "Bezorgen";
        return (
          <article key={mode} className="catering-form-field-card">
            <strong>{title}</strong>
            <div className="ta-grid">
              <label className="ta-field">
                <span>Optie tonen</span>
                <select
                  value={config.enabled ? "yes" : "no"}
                  onChange={(event) =>
                    patchFulfillment(updateMode(fulfillment, mode, { enabled: event.target.value === "yes" }))
                  }
                >
                  <option value="yes">Ja</option>
                  <option value="no">Nee</option>
                </select>
              </label>
              <label className="ta-field">
                <span>Vanaf</span>
                <input
                  type="time"
                  value={config.openTime}
                  disabled={!config.enabled}
                  onChange={(event) =>
                    patchFulfillment(updateMode(fulfillment, mode, { openTime: event.target.value }))
                  }
                />
              </label>
              <label className="ta-field">
                <span>Tot</span>
                <input
                  type="time"
                  value={config.closeTime}
                  disabled={!config.enabled}
                  onChange={(event) =>
                    patchFulfillment(updateMode(fulfillment, mode, { closeTime: event.target.value }))
                  }
                />
              </label>
            </div>
          </article>
        );
      })}

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void save()} saving={saving || localSaving} />
    </div>
  );
}
