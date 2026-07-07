import type { ReactNode } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useCateringTablet } from "../../../context/CateringTabletContext";

interface Props {
  children: ReactNode;
}

export function CateringStartDock({ children }: Props) {
  const { t } = useLanguage();
  const { enabled, menuOpen, toggleMenu, setMenuOpen } = useCateringTablet();

  if (!enabled) return null;

  return (
    <>
      {menuOpen ? (
        <button type="button" className="catering-start-backdrop" aria-label={t("common.close")} onClick={() => setMenuOpen(false)} />
      ) : null}
      <div className={`catering-start-dock${menuOpen ? " is-open" : ""}`}>
        {menuOpen ? (
          <div className="catering-start-menu" role="dialog" aria-label={t("catering.tablet.menu")}>
            <header className="catering-start-menu-head">
              <strong>{t("catering.tablet.menu")}</strong>
              <button type="button" className="catering-start-menu-close" onClick={() => setMenuOpen(false)}>
                {t("common.close")}
              </button>
            </header>
            <div className="catering-start-menu-grid">{children}</div>
          </div>
        ) : null}
        <button type="button" className="catering-start-btn" onClick={toggleMenu} aria-expanded={menuOpen} aria-label={t("catering.tablet.menu")}>
          <span className="catering-start-btn-icon" aria-hidden="true" />
          <span>{t("catering.tablet.start")}</span>
        </button>
      </div>
    </>
  );
}
