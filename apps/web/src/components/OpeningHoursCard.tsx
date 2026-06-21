import type { OpeningHoursSettings } from "@tresamigos/types";
import { pageUrl } from "../lib/api";

export function OpeningHoursCard({ settings }: { settings: OpeningHoursSettings }) {
  if (!settings.enabled) return null;

  return (
    <aside className="opening-hours-card" aria-label="Opening hours">
      <strong className="opening-hours-title">{settings.title}</strong>
      <div className="opening-hours-block">
        <span className="opening-hours-label">{settings.sectionLabel}</span>
        {settings.summary ? <p className="opening-hours-summary">{settings.summary}</p> : null}
        <dl className="opening-hours-list">
          {settings.groups.map((group) => (
            <div className="opening-hours-row" key={`${group.label}-${group.hours}`}>
              <dt>{group.label}</dt>
              <dd>{group.hours}</dd>
            </div>
          ))}
        </dl>
      </div>
      <a className="btn primary opening-hours-cta" href={pageUrl(settings.ctaUrl)}>
        {settings.ctaLabel}
      </a>
    </aside>
  );
}
