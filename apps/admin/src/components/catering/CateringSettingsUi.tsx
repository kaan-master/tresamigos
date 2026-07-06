import { useState } from "react";
import type { CateringLocalizedText, CateringSettings } from "@tresamigos/types";
import { saveCateringSettings } from "../../lib/cateringSettingsApi";

export function localizedLabel(value: CateringLocalizedText, lang: "nl" | "en" = "nl") {
  return lang === "en" ? value.en || value.nl : value.nl || value.en;
}

interface LocalizedFieldProps {
  label: string;
  value: CateringLocalizedText;
  onChange: (value: CateringLocalizedText) => void;
}

export function LocalizedTextFields({ label, value, onChange }: LocalizedFieldProps) {
  return (
    <div className="ta-field ta-grid-wide catering-localized-fields">
      <span>{label}</span>
      <div className="catering-localized-grid">
        <label>
          <small>NL</small>
          <input value={value.nl} onChange={(event) => onChange({ ...value, nl: event.target.value })} />
        </label>
        <label>
          <small>EN</small>
          <input value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} />
        </label>
      </div>
    </div>
  );
}

export interface CateringSettingsPanelProps {
  settings: CateringSettings;
  onSettingsChange: (settings: CateringSettings) => void;
  saving?: boolean;
}

export function useCateringSettingsSave(settings: CateringSettings, onSettingsChange: (settings: CateringSettings) => void) {
  const [message, setMessage] = useState("");
  const [localSaving, setLocalSaving] = useState(false);

  async function save() {
    setLocalSaving(true);
    setMessage("");
    try {
      const saved = await saveCateringSettings(settings);
      onSettingsChange(saved);
      setMessage("Opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setLocalSaving(false);
    }
  }

  return { save, message, localSaving };
}
