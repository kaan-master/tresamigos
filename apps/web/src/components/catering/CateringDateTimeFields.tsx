import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { IconCalendar, IconClock } from "./CateringIcons";

const TIMEZONE = "Europe/Amsterdam";

function toDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1, 12);
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day, 12));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Snap HH:MM to nearest 15 minutes when possible. */
function normalizeTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const rawMinutes = Math.min(59, Math.max(0, Number(match[2])));
  const snapped = Math.round(rawMinutes / 15) * 15;
  const minutes = snapped === 60 ? 0 : snapped;
  const nextHours = snapped === 60 ? (hours + 1) % 24 : hours;
  return `${String(nextHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

interface Props {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function CateringDateTimeFields({ date, time, onDateChange, onTimeChange }: Props) {
  const { t, lang } = useLanguage();
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => (date ? parseDateKey(date) : new Date()));
  const calendarRef = useRef<HTMLDivElement>(null);

  const locale = lang === "nl" ? "nl-NL" : "en-GB";
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + index))
    );
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(visibleMonth);
  const selectedDate = date ? parseDateKey(date) : null;

  useEffect(() => {
    function handleClick(event: MouseEvent | TouchEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setCalendarOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  function selectDate(next: Date) {
    onDateChange(toDateKey(next));
    setCalendarOpen(false);
  }

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" })
    : t("catering.field.datePlaceholder");

  return (
    <div className="catering-datetime-fields">
      <div className="catering-picker" ref={calendarRef}>
        <button type="button" className={`catering-picker-trigger${calendarOpen ? " is-open" : ""}`} onClick={() => setCalendarOpen((open) => !open)}>
          <IconCalendar width={18} height={18} />
          <span>
            <em>{t("catering.field.date")}</em>
            <strong>{dateLabel}</strong>
          </span>
        </button>
        {calendarOpen ? (
          <div className="catering-picker-popover catering-date-popover">
            <div className="catering-date-nav">
              <button type="button" className="catering-date-nav-btn" onClick={() => setVisibleMonth((current) => addMonths(current, -1))} aria-label={t("common.back")}>
                ‹
              </button>
              <strong>{monthLabel}</strong>
              <button type="button" className="catering-date-nav-btn" onClick={() => setVisibleMonth((current) => addMonths(current, 1))} aria-label={t("common.next")}>
                ›
              </button>
            </div>
            <div className="catering-date-weekdays">
              {weekdayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="catering-date-grid">
              {buildCalendarDays(visibleMonth).map((day, index) => {
                if (!day) return <span key={`empty-${index}`} className="catering-date-cell is-empty" />;
                const key = toDateKey(day);
                const isPast = key < todayKey;
                const isSelected = key === date;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`catering-date-cell${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                    disabled={isPast}
                    onClick={() => selectDate(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <label className="catering-picker catering-time-field">
        <span className="catering-picker-trigger catering-time-trigger">
          <IconClock width={18} height={18} />
          <span>
            <em>{t("catering.field.time")}</em>
            <strong>{time || t("catering.field.timePlaceholder")}</strong>
          </span>
        </span>
        <input
          className="catering-time-input"
          type="time"
          step={900}
          value={time}
          onChange={(event) => onTimeChange(normalizeTime(event.target.value))}
          aria-label={t("catering.field.time")}
        />
      </label>
    </div>
  );
}
