import { useLanguage } from "../../../i18n/LanguageProvider";
import { useCateringTablet } from "../../../context/CateringTabletContext";
import { CateringTabletToggle } from "./CateringTabletToggle";

interface Props {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function CateringTabletBar({ title, showBack, onBack }: Props) {
  const { t } = useLanguage();
  const { enabled, goHub } = useCateringTablet();

  if (!enabled) return null;

  return (
    <header className="catering-tablet-bar">
      <div className="catering-tablet-bar-main">
        {showBack ? (
          <button type="button" className="catering-tablet-back" onClick={onBack || goHub}>
            ← {t("common.back")}
          </button>
        ) : (
          <span className="catering-tablet-bar-spacer" />
        )}
        <strong className="catering-tablet-bar-title">{title}</strong>
        <CateringTabletToggle />
      </div>
    </header>
  );
}
