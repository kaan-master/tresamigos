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

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

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
  const [timeOpen, setTimeOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => (date ? parseDateKey(date) : new Date()));
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  const locale = lang === "nl" ? "nl-NL" : "en-GB";
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + index))
    );
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(visibleMonth);
  const selectedDate = date ? parseDateKey(date) : null;
  const [hour, minute] = time ? time.split(":") : ["", ""];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setCalendarOpen(false);
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) setTimeOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectDate(next: Date) {
    onDateChange(toDateKey(next));
    setCalendarOpen(false);
  }

  function selectTime(nextHour: string, nextMinute: string) {
    onTimeChange(`${nextHour}:${nextMinute}`);
    setTimeOpen(false);
  }

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" })
    : t("catering.field.datePlaceholder");

  const timeLabel = time ? time : t("catering.field.timePlaceholder");

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

      <div className="catering-picker" ref={timeRef}>
        <button type="button" className={`catering-picker-trigger${timeOpen ? " is-open" : ""}`} onClick={() => setTimeOpen((open) => !open)}>
          <IconClock width={18} height={18} />
          <span>
            <em>{t("catering.field.time")}</em>
            <strong>{timeLabel}</strong>
          </span>
        </button>
        {timeOpen ? (
          <div className="catering-picker-popover catering-time-popover">
            <div className="catering-time-columns">
              <div>
                <span className="catering-time-label">{t("catering.field.hour")}</span>
                <div className="catering-time-scroll">
                  {HOURS.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`catering-time-option${hour === entry ? " is-selected" : ""}`}
                      onClick={() => selectTime(entry, minute || "00")}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="catering-time-label">{t("catering.field.minute")}</span>
                <div className="catering-time-scroll">
                  {MINUTES.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      className={`catering-time-option${minute === entry ? " is-selected" : ""}`}
                      onClick={() => selectTime(hour || "12", entry)}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
