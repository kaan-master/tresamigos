import { useEffect, useMemo, useState } from "react";
import type { PublicAnalyticsStats } from "@tresamigos/types";
import { useLanguage } from "../i18n/LanguageProvider";
import { apiUrl } from "../lib/api";

function formatDayLabel(date: string, locale: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

export function LiveVisitorsStats() {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState<PublicAnalyticsStats | null>(null);
  const locale = lang === "nl" ? "nl-NL" : "en-GB";

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(apiUrl("/api/analytics/stats"));
        if (!response.ok) return;
        const data = (await response.json()) as PublicAnalyticsStats;
        if (active) setStats(data);
      } catch {
        // best-effort
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 2_000);
    const onPing = () => void load();
    window.addEventListener("ta-analytics-ping", onPing);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("ta-analytics-ping", onPing);
    };
  }, []);

  const recentDays = useMemo(() => (stats?.dailyLog ?? []).slice(-7), [stats?.dailyLog]);
  const maxVisitors = useMemo(
    () => Math.max(...recentDays.map((day) => day.visitors), 1),
    [recentDays]
  );

  if (!stats) return null;

  return (
    <section className="live-stats shell" aria-live="polite">
      <div className="live-stats-now">
        <span className="live-stats-dot" aria-hidden="true" />
        <p>
          <strong>{stats.liveNow}</strong>
          <span>{t("analytics.liveNow")}</span>
        </p>
      </div>

      <div className="live-stats-today">
        <span>{t("analytics.today")}</span>
        <strong>{stats.viewsToday}</strong>
      </div>

      {recentDays.length ? (
        <div className="live-stats-log">
          <span className="live-stats-log-title">{t("analytics.dailyLog")}</span>
          <div className="live-stats-bars">
            {recentDays.map((day) => (
              <div className="live-stats-bar" key={day.date}>
                <div
                  className="live-stats-bar-fill"
                  style={{ height: `${Math.max(8, (day.visitors / maxVisitors) * 100)}%` }}
                  title={`${formatDayLabel(day.date, locale)}: ${day.visitors}`}
                />
                <span>{formatDayLabel(day.date, locale)}</span>
                <strong>{day.visitors}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
