import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { nl } from "react-day-picker/locale";
import type { AnalyticsDailyEntry } from "@tresamigos/types";

const TIMEZONE = "Europe/Amsterdam";

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

interface Props {
  dailyLog: AnalyticsDailyEntry[];
  viewsToday: number;
}

export function VisitorCalendar({ dailyLog, viewsToday }: Props) {
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

  const activeDays = useMemo(
    () => [...visitorMap.entries()].filter(([, count]) => count > 0).map(([date]) => parseDateKey(date)),
    [visitorMap]
  );

  const selectedKey = toDateKey(selected);
  const selectedCount = visitorMap.get(selectedKey) ?? 0;
  const isToday = selectedKey === toDateKey(today);

  return (
    <section className="ta-visitor-calendar">
      <header className="ta-visitor-calendar-head">
        <div>
          <h3 className="ta-section-title">Bezoekerskalender</h3>
          <p className="ta-seo-hint">Klik op een dag — alleen dagen met bezoekers zijn gemarkeerd (90 dagen opgeslagen).</p>
        </div>
        <article className="ta-visitor-calendar-pill">
          <strong>{selectedCount}</strong>
          <span>
            {isToday ? "uniek vandaag" : "uniek op "}
            {!isToday ? selected.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" }) : null}
          </span>
        </article>
      </header>

      <DayPicker
        mode="single"
        locale={nl}
        selected={selected}
        onSelect={(date) => date && setSelected(date)}
        modifiers={{ hasVisitors: activeDays }}
        modifiersClassNames={{ hasVisitors: "ta-cal-has-visitors" }}
        components={{
          DayButton: ({ day, modifiers, ...props }) => {
            const key = toDateKey(day.date);
            const count = visitorMap.get(key) ?? 0;
            return (
              <button {...props} type="button" className={`${props.className || ""} ta-cal-day`.trim()} title={count ? `${count} bezoekers` : undefined}>
                <span>{day.date.getDate()}</span>
                {count > 0 ? <em className="ta-cal-day-count">{count}</em> : null}
              </button>
            );
          }
        }}
      />

      {activeDays.length === 0 ? (
        <p className="ta-seo-hint" style={{ marginTop: 12 }}>
          Nog geen opgeslagen bezoekersdagen — open de website om data te verzamelen.
        </p>
      ) : null}
    </section>
  );
}
