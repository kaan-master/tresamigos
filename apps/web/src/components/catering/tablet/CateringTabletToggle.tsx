import { useLanguage } from "../../../i18n/LanguageProvider";
import { useCateringTablet } from "../../../context/CateringTabletContext";
import { IconGrid } from "../CateringIcons";

export function CateringTabletToggle() {
  const { t } = useLanguage();
  const { enabled, toggleEnabled } = useCateringTablet();

  return (
    <button
      type="button"
      className={`catering-tablet-toggle${enabled ? " is-active" : ""}`}
      onClick={toggleEnabled}
      aria-pressed={enabled}
      aria-label={enabled ? t("catering.tablet.off") : t("catering.tablet.on")}
    >
      <IconGrid width={16} height={16} />
      <span>{enabled ? t("catering.tablet.active") : t("catering.tablet.label")}</span>
    </button>
  );
}
