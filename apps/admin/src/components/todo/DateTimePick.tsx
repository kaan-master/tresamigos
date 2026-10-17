import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  MONTHS_NL,
  WEEKDAYS_NL,
  addMonths,
  formatHm,
  formatNlDate,
  joinDateTime,
  monthGrid,
  parseHm,
  parseIsoDate,
  splitDateTime,
  todayIso,
} from '../../lib/todo/datetime';

type Variant = 'field' | 'bare';

function Popover({
  open,
  anchor,
  width,
  onClose,
  children,
}: {
  open: boolean;
  anchor: HTMLElement | null;
  width: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 8, left: 8 });

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const height = box.current?.offsetHeight ?? 360;
    let left = rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    left = Math.max(8, left);
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    setPos({ top, left });
  }, [open, anchor, width]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      const target = event.target as Node;
      if (anchor?.contains(target) || box.current?.contains(target)) return;
      onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open, anchor, onClose]);

  if (!open) return null;
  return createPortal(
    <div ref={box} className="dt-pop" style={{ top: pos.top, left: pos.left, width }} role="dialog">
      {children}
    </div>,
    document.body,
  );
}

function Calendar({
  value,
  onPick,
  allowEmpty,
}: {
  value: string;
  onPick: (next: string) => void;
  allowEmpty?: boolean;
}) {
  const selected = parseIsoDate(value);
  const today = todayIso();
  const [cursor, setCursor] = useState(() => selected ?? parseIsoDate(today)!);

  useEffect(() => {
    if (selected) setCursor(selected);
  }, [value]);

  const cells = monthGrid(cursor.year, cursor.month);

  return (
    <div className="dt-cal">
      <header className="dt-cal-head">
        <button type="button" className="dt-nav" aria-label="Vorige maand" onClick={() => setCursor((current) => ({ ...current, ...addMonths(current.year, current.month, -1) }))}>
          <ChevronLeft size={16} />
        </button>
        <strong>{MONTHS_NL[cursor.month - 1]} {cursor.year}</strong>
        <button type="button" className="dt-nav" aria-label="Volgende maand" onClick={() => setCursor((current) => ({ ...current, ...addMonths(current.year, current.month, 1) }))}>
          <ChevronRight size={16} />
        </button>
      </header>
      <div className="dt-dow">{WEEKDAYS_NL.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="dt-grid">
        {cells.map((cell) => {
          const isSelected = cell.iso === value;
          const isToday = cell.iso === today;
          return (
            <button
              key={cell.iso}
              type="button"
              className={`dt-day${cell.outside ? ' is-out' : ''}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onPick(cell.iso)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <footer className="dt-cal-foot">
        <button type="button" onClick={() => onPick(today)}>Vandaag</button>
        {allowEmpty ? <button type="button" onClick={() => onPick('')}>Wissen</button> : null}
      </footer>
    </div>
  );
}

function ClockFace({
  value,
  onPick,
}: {
  value: string;
  onPick: (next: string) => void;
}) {
  const parsed = parseHm(value) ?? { hour: 9, minute: 0 };
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const face = useRef<HTMLDivElement>(null);

  function apply(hour: number, minute: number) {
    onPick(formatHm(hour, minute));
  }

  function fromPointer(event: { clientX: number; clientY: number }) {
    const root = face.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    let deg = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    const dist = Math.hypot(x, y);
    if (mode === 'hour') {
      const inner = dist < rect.width * 0.32;
      const slot = Math.round(deg / 30) % 12;
      apply(inner ? slot : slot + 12, parsed.minute);
      return;
    }
    apply(parsed.hour, Math.round(deg / 6) % 60);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    fromPointer(event);
    const move = (next: PointerEvent) => fromPointer(next);
    const up = (next: PointerEvent) => {
      fromPointer(next);
      if (mode === 'hour') setMode('minute');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  const hourAngle = (parsed.hour % 12) * 30 + parsed.minute * 0.5;
  const minuteAngle = parsed.minute * 6;

  return (
    <div className="dt-clock">
      <div className="dt-clock-digital" role="group" aria-label="Tijd">
        <button type="button" className={mode === 'hour' ? 'is-on' : ''} onClick={() => setMode('hour')}>{formatHm(parsed.hour, 0).slice(0, 2)}</button>
        <span>:</span>
        <button type="button" className={mode === 'minute' ? 'is-on' : ''} onClick={() => setMode('minute')}>{formatHm(0, parsed.minute).slice(3)}</button>
      </div>
      <div ref={face} className="dt-clock-face" onPointerDown={onPointerDown}>
        <i className="dt-hand is-hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
        <i className="dt-hand is-minute" style={{ transform: `rotate(${minuteAngle}deg)` }} />
        <i className="dt-clock-center" />
        {mode === 'hour' ? (
          <>
            {Array.from({ length: 12 }, (_, index) => {
              const hour = index === 0 ? 0 : index;
              const selected = parsed.hour === hour;
              return (
                <span key={`in-${hour}`} className={`dt-tick is-inner${selected ? ' is-on' : ''}`} style={{ '--i': index } as CSSProperties}>
                  {hour}
                </span>
              );
            })}
            {Array.from({ length: 12 }, (_, index) => {
              const hour = index === 0 ? 12 : index + 12;
              const selected = parsed.hour === hour;
              return (
                <span key={`out-${hour}`} className={`dt-tick is-outer${selected ? ' is-on' : ''}`} style={{ '--i': index } as CSSProperties}>
                  {hour}
                </span>
              );
            })}
          </>
        ) : (
          Array.from({ length: 12 }, (_, index) => {
            const minute = index * 5;
            const selected = Math.round(parsed.minute / 5) % 12 === index;
            return (
              <span key={`m-${minute}`} className={`dt-tick is-outer${selected ? ' is-on' : ''}`} style={{ '--i': index } as CSSProperties}>
                {formatHm(0, minute).slice(3)}
              </span>
            );
          })
        )}
      </div>
      <div className="dt-clock-quick">
        {['08:00', '09:00', '12:00', '13:00', '17:00'].map((item) => (
          <button key={item} type="button" className={value === item ? 'is-on' : ''} onClick={() => { onPick(item); setMode('minute'); }}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function Trigger({
  open,
  disabled,
  variant,
  ariaLabel,
  icon,
  empty,
  children,
  onToggle,
  buttonRef,
}: {
  open: boolean;
  disabled?: boolean;
  variant: Variant;
  ariaLabel: string;
  icon: ReactNode;
  empty: boolean;
  children: ReactNode;
  onToggle: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`dt-trigger is-${variant}${open ? ' is-open' : ''}${empty ? ' is-empty' : ''}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function DatePick({
  value,
  onChange,
  disabled,
  ariaLabel = 'Datum',
  placeholder = 'Kies datum',
  allowEmpty = true,
  variant = 'field',
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  variant?: Variant;
  id?: string;
}) {
  const fallbackId = useId();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <div className="dt-field" id={id ?? fallbackId}>
      <Trigger
        buttonRef={setAnchor}
        open={open}
        disabled={disabled}
        variant={variant}
        ariaLabel={ariaLabel}
        icon={<CalendarDays size={15} />}
        empty={!value}
        onToggle={() => setOpen((current) => !current)}
      >
        {value ? formatNlDate(value) : placeholder}
      </Trigger>
      <Popover open={open && !disabled} anchor={anchor} width={308} onClose={() => setOpen(false)}>
        <Calendar
          value={value}
          allowEmpty={allowEmpty}
          onPick={(next) => {
            onChange(next);
            if (next || allowEmpty) setOpen(false);
          }}
        />
      </Popover>
    </div>
  );
}

export function TimePick({
  value,
  onChange,
  disabled,
  ariaLabel = 'Tijd',
  placeholder = 'Kies tijd',
  variant = 'field',
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <div className="dt-field">
      <Trigger
        buttonRef={setAnchor}
        open={open}
        disabled={disabled}
        variant={variant}
        ariaLabel={ariaLabel}
        icon={<Clock size={15} />}
        empty={!value}
        onToggle={() => setOpen((current) => !current)}
      >
        {value || placeholder}
      </Trigger>
      <Popover open={open && !disabled} anchor={anchor} width={268} onClose={() => setOpen(false)}>
        <ClockFace
          value={value}
          onPick={(next) => {
            onChange(next);
          }}
        />
      </Popover>
    </div>
  );
}

export function DateTimePick({
  value,
  onChange,
  disabled,
  dateLabel = 'Datum',
  timeLabel = 'Tijd',
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  dateLabel?: string;
  timeLabel?: string;
}) {
  const { date, time } = splitDateTime(value);
  return (
    <div className="dt-pair">
      <DatePick
        value={date}
        disabled={disabled}
        allowEmpty={false}
        ariaLabel={dateLabel}
        onChange={(next) => onChange(joinDateTime(next, time || '09:00'))}
      />
      <TimePick
        value={time}
        disabled={disabled}
        ariaLabel={timeLabel}
        onChange={(next) => onChange(joinDateTime(date || todayIso(), next))}
      />
    </div>
  );
}
