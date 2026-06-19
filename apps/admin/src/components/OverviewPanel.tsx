import { useEffect, useMemo, useState } from "react";
import type { AnalyticsSnapshot } from "@tresamigos/types";
import { api } from "../lib/api";
import { IconEye, IconOverview, IconUsers } from "./AdminIcons";
import { BarChart, DonutChart, chartColors } from "./DonutChart";

function formatPath(path: string) {
  if (path === "/") return "Home";
  return path.replace(/^\//, "").replace(/-/g, " ");
}

export function OverviewPanel() {
  const [stats, setStats] = useState<AnalyticsSnapshot | null>(null);
  const [error, setError] = useState("");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await api<AnalyticsSnapshot>("/api/admin/analytics");
        if (active) {
          setStats((prev) => {
            if (prev && data.liveNow !== prev.liveNow) setPulse(true);
            return data;
          });
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Analytics laden mislukt.");
        }
      }
    }

    void load();
    const interval = window.setInterval(() => void load(), 2_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(timer);
  }, [pulse, stats?.liveNow]);

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

  const liveNow = stats?.liveNow ?? 0;

  return (
    <div className="ta-analytics">
      {error ? <div className="ta-alert is-error">{error}</div> : null}

      <div className={`ta-analytics-live${liveNow > 0 ? " is-hot" : ""}${pulse ? " is-pulse" : ""}`}>
        <span className="ta-live-dot" aria-hidden="true" />
        <div className="ta-analytics-live-copy">
          <strong>{liveNow}</strong>
          <span>{liveNow === 1 ? "bezoeker live op de website" : "bezoekers live op de website"}</span>
          <small>Direct zichtbaar · ververst elke 2 sec · site stuurt elke 5 sec een ping</small>
        </div>
        <IconEye className="ta-analytics-live-icon" width={36} height={36} />
      </div>

      <div className="ta-kpis">
        <article className="ta-kpi ta-kpi-icon">
          <IconUsers width={20} height={20} />
          <span>Unieke bezoekers vandaag</span>
          <strong>{stats?.viewsToday ?? 0}</strong>
          <small>Per IP-adres, max. 1x per dag</small>
        </article>
        <article className="ta-kpi ta-kpi-icon">
          <IconOverview width={20} height={20} />
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
            <div className="ta-empty">Nog geen paginabezoeken vandaag — open de site in een ander tabblad.</div>
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

      {stats?.dailyLog?.length ? (
        <section className="ta-location-editor">
          <h3 className="ta-section-title">Bezoekers per dag</h3>
          <p className="ta-seo-hint">Unieke bezoekers per IP — laatste 14 dagen</p>
          <div className="ta-data-list">
            {[...stats.dailyLog].reverse().map((day) => (
              <div className="ta-data-row" key={day.date}>
                <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString("nl-NL")}</span>
                <strong>{day.visitors}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
          Laatste update: {new Date(stats.updatedAt).toLocaleTimeString("nl-NL")} · live counter elke 2 sec
        </p>
      ) : null}
    </div>
  );
}
