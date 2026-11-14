import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { nl } from "react-day-picker/locale";
import type { AnalyticsDailyEntry, AnalyticsHourlyEntry } from "@tresamigos/types";

const TIMEZONE = "Europe/Amsterdam";

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function heatLevel(count: number, mean: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  if (count >= Math.max(mean * 1.5, max * 0.85)) return 5;
  if (count >= mean * 1.2) return 4;
  if (count >= mean) return 3;
  if (count >= mean * 0.7) return 2;
  return 1;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function peakRangeLabel(hours: AnalyticsHourlyEntry[]) {
  const max = Math.max(...hours.map((item) => item.visitors), 0);
  if (max <= 0) return "";
  const peakHour = hours.reduce((best, item) => (item.visitors > best.visitors ? item : best)).hour;
  let first = peakHour;
  let last = peakHour;
  while (first > 0 && (hours[first - 1]?.visitors || 0) >= max * 0.8) first -= 1;
  while (last < 23 && (hours[last + 1]?.visitors || 0) >= max * 0.8) last += 1;
  if (first === last) return `Piek rond ${formatHour(first)}`;
  return `Piek ${formatHour(first)}–${formatHour(last + 1)}`;
}

function PeakHoursChart({ hours }: { hours: AnalyticsHourlyEntry[] }) {
  const values = hours.length ? hours : Array.from({ length: 24 }, (_, hour) => ({ hour, visitors: 0 }));
  const max = Math.max(...values.map((item) => item.visitors), 0);
  const width = 260;
  const height = 118;
  const padX = 8;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2 - 16;
  const points = values.map((item, index) => {
    const x = padX + (index / 23) * innerW;
    const y = padY + innerH - (max > 0 ? (item.visitors / max) * innerH : 0);
    return { ...item, x, y };
  });
  const area = [
    `${padX},${padY + innerH}`,
    ...points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`),
    `${padX + innerW},${padY + innerH}`
  ].join(" ");
  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const peak = peakRangeLabel(values);
  const ticks = [0, 6, 12, 18, 23];

  return (
    <div className="ta-peak-hours">
      <div className="ta-peak-hours-head">
        <strong>Piekuren</strong>
        <span>{peak || "Gemiddelde drukke dag"}</span>
      </div>
      {max > 0 ? (
        <svg className="ta-peak-hours-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bezoekers per uur op een gemiddelde drukke dag">
          <defs>
            <linearGradient id="ta-peak-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a4b00" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#fcb92a" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#fcb92a" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((lineY) => (
            <line
              key={lineY}
              x1={padX}
              x2={padX + innerW}
              y1={padY + innerH * (1 - lineY)}
              y2={padY + innerH * (1 - lineY)}
              className="ta-peak-grid"
            />
          ))}
          <polygon points={area} fill="url(#ta-peak-fill)" />
          <polyline points={line} fill="none" stroke="#8a4b00" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          {points
            .filter((point) => max > 0 && point.visitors >= max * 0.8)
            .map((point) => (
              <circle key={point.hour} cx={point.x} cy={point.y} r="3.2" fill="#8a4b00">
                <title>
                  {formatHour(point.hour)} · {point.visitors} uniek
                </title>
              </circle>
            ))}
          {ticks.map((hour) => {
            const x = padX + (hour / 23) * innerW;
            return (
              <text key={hour} x={x} y={height - 2} textAnchor="middle" className="ta-peak-tick">
                {hour === 0 ? "0u" : hour === 23 ? "23u" : `${hour}u`}
              </text>
            );
          })}
        </svg>
      ) : (
        <p className="ta-seo-hint" style={{ margin: 0 }}>
          Piekuren vullen zich per uur zodra er bezoekers binnenkomen.
        </p>
      )}
      {max > 0 ? <small>Unieke bezoekers per tijdstip, gemiddeld over drukke dagen.</small> : null}
    </div>
  );
}

interface Props {
  dailyLog: AnalyticsDailyEntry[];
  viewsToday: number;
  hourlyBusyAverage?: AnalyticsHourlyEntry[];
}

export function VisitorCalendar({ dailyLog, viewsToday, hourlyBusyAverage = [] }: Props) {
  const today = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<Date>(today);

  const visitorMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of dailyLog) {
      map.set(entry.date, entry.visitors);
    }
    const todayKey = toDateKey(today);
    if (!map.has(todayKey)) {
      map.set(todayKey, viewsToday);
    } else if (viewsToday > (map.get(todayKey) || 0)) {
      map.set(todayKey, viewsToday);
    }
    return map;
  }, [dailyLog, viewsToday, today]);

  const { activeDays, mean, max } = useMemo(() => {
    const entries = [...visitorMap.entries()].filter(([, count]) => count > 0);
    const counts = entries.map(([, count]) => count);
    const total = counts.reduce((sum, count) => sum + count, 0);
    return {
      activeDays: entries.map(([date]) => parseDateKey(date)),
      mean: counts.length ? total / counts.length : 0,
      max: Math.max(...counts, 0)
    };
  }, [visitorMap]);

  const selectedKey = toDateKey(selected);
  const selectedCount = visitorMap.get(selectedKey) ?? 0;
  const isToday = selectedKey === toDateKey(today);
  const vsUsual =
    mean > 0 && selectedCount > 0
      ? selectedCount >= mean * 1.15
        ? "drukker dan gebruikelijk"
        : selectedCount < mean * 0.85
          ? "rustiger dan gebruikelijk"
          : "rond het gemiddelde"
      : "";

  return (
    <section className="ta-visitor-calendar">
      <header className="ta-visitor-calendar-head">
        <div>
          <h3 className="ta-section-title">Bezoekerskalender</h3>
          <p className="ta-seo-hint">Donkerder = meer unieke bezoekers dan gebruikelijk (90 dagen).</p>
        </div>
      </header>

      <div className="ta-visitor-calendar-body">
        <DayPicker
          mode="single"
          locale={nl}
          selected={selected}
          onSelect={(date) => date && setSelected(date)}
          modifiers={{ hasVisitors: activeDays }}
          modifiersClassNames={{ hasVisitors: "ta-cal-has-visitors" }}
          components={{
            DayButton: ({ day, ...props }) => {
              const key = toDateKey(day.date);
              const count = visitorMap.get(key) ?? 0;
              const level = heatLevel(count, mean, max);
              return (
                <button
                  {...props}
                  type="button"
                  className={`${props.className || ""} ta-cal-day ta-cal-heat-${level}`.trim()}
                  title={count ? `${count} uniek · ${level >= 4 ? "drukker dan gebruikelijk" : "bezoekers"}` : undefined}
                >
                  <span>{day.date.getDate()}</span>
                  {count > 0 ? <em className="ta-cal-day-count">{count}</em> : null}
                </button>
              );
            }
          }}
        />

        <aside className="ta-visitor-calendar-side">
          <article className="ta-visitor-calendar-pill">
            <strong>{selectedCount}</strong>
            <span>
              {isToday ? "uniek vandaag" : "uniek op "}
              {!isToday ? selected.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" }) : null}
            </span>
            {vsUsual ? <small>{vsUsual}</small> : null}
          </article>
          <PeakHoursChart hours={hourlyBusyAverage} />
        </aside>
      </div>

      {activeDays.length === 0 ? (
        <p className="ta-seo-hint" style={{ marginTop: 12 }}>
          Nog geen opgeslagen bezoekersdagen. Open de website om data te verzamelen.
        </p>
      ) : null}
    </section>
  );
}
