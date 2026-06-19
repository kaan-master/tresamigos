import { useEffect, useMemo, useState } from "react";
import type { AnalyticsSnapshot } from "@tresamigos/types";
import { api } from "../lib/api";
import { BarChart, DonutChart, chartColors } from "./DonutChart";

function formatPath(path: string) {
  if (path === "/") return "Home";
  return path.replace(/^\//, "").replace(/-/g, " ");
}

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

  const pageSegments = useMemo(() => {
    const pages = stats?.topPages ?? [];
    const colors = chartColors(pages.length);
    return pages.map((page, index) => ({
      label: formatPath(page.path),
      value: page.views,
      color: colors[index]
    }));
  }, [stats?.topPages]);

  const barData = useMemo(
    () =>
      (stats?.topPages ?? []).map((page) => ({
        label: formatPath(page.path),
        value: page.views
      })),
    [stats?.topPages]
  );

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
          <span>Unieke bezoekers vandaag</span>
          <strong>{stats?.viewsToday ?? 0}</strong>
          <small>Per IP-adres, max. 1x per dag</small>
        </article>
        <article className="ta-kpi">
          <span>Unieke bezoekers (7 dagen)</span>
          <strong>{stats?.viewsWeek ?? 0}</strong>
          <small>Samengesteld over de afgelopen week</small>
        </article>
      </div>

      <section className="ta-analytics-charts">
        <article className="ta-chart-card">
          <header className="ta-chart-card-head">
            <h3 className="ta-section-title">Meest bezochte pagina&apos;s</h3>
            <p>Unieke bezoekers per pagina vandaag</p>
          </header>
          {pageSegments.length ? (
            <DonutChart segments={pageSegments} centerLabel="BEZOEK" />
          ) : (
            <div className="ta-empty">Nog geen paginabezoeken vandaag.</div>
          )}
        </article>

        <article className="ta-chart-card">
          <header className="ta-chart-card-head">
            <h3 className="ta-section-title">Paginaverdeling</h3>
            <p>Staafdiagram per route</p>
          </header>
          {barData.length ? (
            <BarChart data={barData} />
          ) : (
            <div className="ta-empty">Nog geen data voor vandaag.</div>
          )}
        </article>
      </section>

      {stats?.topPages.length ? (
        <section className="ta-location-editor">
          <h3 className="ta-section-title">Top routes vandaag</h3>
          <div className="ta-data-list">
            {stats.topPages.map((page) => (
              <div className="ta-data-row" key={page.path}>
                <span>{page.path}</span>
                <strong>{page.views}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stats?.updatedAt ? (
        <p className="ta-seo-hint">
          Laatste update: {new Date(stats.updatedAt).toLocaleTimeString("nl-NL")} · ververst elke 10 sec · bezoekers per IP
        </p>
      ) : null}
    </div>
  );
}
