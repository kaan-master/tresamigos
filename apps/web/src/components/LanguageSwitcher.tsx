import { useLanguage } from "../i18n/LanguageProvider";
import type { Lang } from "../i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  function select(next: Lang) {
    setLang(next);
  }

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {(["en", "nl"] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={lang === code ? "is-active" : ""}
          aria-pressed={lang === code}
          onClick={() => select(code)}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  );
}
