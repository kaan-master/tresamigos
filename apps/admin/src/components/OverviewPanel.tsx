import { useEffect, useState } from "react";
import type { AnalyticsSnapshot } from "@tresamigos/types";
import { api } from "../lib/api";

export function OverviewPanel() {
  const [stats, setStats] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await api<AnalyticsSnapshot>("/api/admin/analytics");
        if (active) {
          setStats(data);
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Analytics laden mislukt.");
        }
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (!stats && !error) {
    return <div className="ta-empty">Live statistieken laden...</div>;
  }

  return (
    <div className="ta-analytics">
      {error ? <div className="ta-alert is-error">{error}</div> : null}

      <div className="ta-analytics-live">
        <span className="ta-live-dot" aria-hidden="true" />
        <div>
          <strong>{stats?.liveNow ?? 0}</strong>
          <span>mensen kijken nu op de website</span>
        </div>
      </div>

      <div className="ta-kpis">
        <article className="ta-kpi">
          <span>Bezoekers vandaag</span>
          <strong>{stats?.viewsToday ?? 0}</strong>
        </article>
        <article className="ta-kpi">
          <span>Bezoekers afgelopen 7 dagen</span>
          <strong>{stats?.viewsWeek ?? 0}</strong>
        </article>
      </div>

      <section className="ta-location-editor">
        <h3 className="ta-section-title">Populaire pagina&apos;s vandaag</h3>
        {stats?.topPages.length ? (
          <div className="ta-data-list">
            {stats.topPages.map((page) => (
              <div className="ta-data-row" key={page.path}>
                <span>{page.path}</span>
                <strong>{page.views}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="ta-empty">Nog geen paginaweergaven vandaag.</div>
        )}
        {stats?.updatedAt ? (
          <p className="ta-seo-hint">Laatste update: {new Date(stats.updatedAt).toLocaleTimeString("nl-NL")} · ververst elke 10 sec</p>
        ) : null}
      </section>
    </div>
  );
}
