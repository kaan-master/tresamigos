import { FormSaveBar } from "../FormSaveBar";
import { useCateringSettingsSave, type CateringSettingsPanelProps } from "./CateringSettingsUi";

export function CateringNotificationsPanel({ settings, onSettingsChange, saving }: CateringSettingsPanelProps) {
  const { save, message, localSaving } = useCateringSettingsSave(settings, onSettingsChange);
  const notifications = settings.notifications;

  function updateNotifications(patch: Partial<typeof notifications>) {
    onSettingsChange({
      ...settings,
      notifications: { ...notifications, ...patch }
    });
  }

  return (
    <div className="catering-settings-page">
      <header className="catering-settings-head">
        <h3>Meldingen</h3>
        <p className="ta-seo-hint">Stel in waar nieuwe cateringaanvragen naartoe gaan.</p>
      </header>

      <div className="ta-grid">
        <label className="ta-field ta-grid-wide">
          <span>Mailadres ontvanger</span>
          <input
            type="email"
            value={notifications.recipientEmail}
            onChange={(event) => updateNotifications({ recipientEmail: event.target.value })}
          />
        </label>
        <label className="ta-field">
          <span>Melding bij nieuwe aanvraag</span>
          <select
            value={notifications.notifyOnNewOrder ? "yes" : "no"}
            onChange={(event) => updateNotifications({ notifyOnNewOrder: event.target.value === "yes" })}
          >
            <option value="yes">Aan</option>
            <option value="no">Uit</option>
          </select>
        </label>
        <label className="ta-field">
          <span>Mail bij statuswijziging</span>
          <select
            value={notifications.notifyOnStatusChange ? "yes" : "no"}
            onChange={(event) => updateNotifications({ notifyOnStatusChange: event.target.value === "yes" })}
          >
            <option value="no">Uit (later beschikbaar)</option>
            <option value="yes">Aan</option>
          </select>
        </label>
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}
      <FormSaveBar onSave={() => void save()} saving={saving || localSaving} />
    </div>
  );
}
