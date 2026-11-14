import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ApplicationStatus } from "@tresamigos/types";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@tresamigos/types";

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  nieuw: "#0078d4",
  contact_opgenomen: "#5c2d91",
  in_gesprek: "#c19c00",
  aangenomen: "#107c10",
  afgewezen: "#d13438",
  ingetrokken: "#8a8886"
};

export function applicationStatusColor(status: string) {
  if (status in APPLICATION_STATUS_COLORS) {
    return APPLICATION_STATUS_COLORS[status as ApplicationStatus];
  }
  return "#8a8886";
}

export function StatusDot({ color, label }: { color: string; label?: string }) {
  return (
    <span
      className="status-dot"
      style={{ background: color, boxShadow: `0 0 0 3px ${color}29` }}
      title={label}
      aria-hidden="true"
    />
  );
}

export function StatusChip({
  status,
  label,
  color
}: {
  status: string;
  label?: string;
  color?: string;
}) {
  const resolvedLabel =
    label ||
    ((APPLICATION_STATUSES as readonly string[]).includes(status)
      ? APPLICATION_STATUS_LABELS[status as ApplicationStatus]
      : status);
  return (
    <span className="status-chip">
      <StatusDot color={color || applicationStatusColor(status)} label={resolvedLabel} />
      {resolvedLabel}
    </span>
  );
}

type StatusOption = { value: string; label: string; color: string };

const DEFAULT_OPTIONS: StatusOption[] = APPLICATION_STATUSES.map((status) => ({
  value: status,
  label: APPLICATION_STATUS_LABELS[status],
  color: APPLICATION_STATUS_COLORS[status]
}));

function placeList(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const gap = 6;
  const below = window.innerHeight - rect.bottom - 12;
  const above = rect.top - 12;
  const openUp = below < 220 && above > below;
  const maxHeight = Math.max(180, Math.min(320, openUp ? above : Math.max(below, 180)));
  const width = Math.max(rect.width, 220);
  let left = rect.left;
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
  if (openUp) {
    return { top: "auto" as const, bottom: window.innerHeight - rect.top + gap, left, width, maxHeight };
  }
  return { top: rect.bottom + gap, bottom: "auto" as const, left, width, maxHeight };
}

export function StatusCombo({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  emptyLabel,
  disabled,
  placeholder = "Zoek status...",
  compact
}: {
  value: string;
  onChange: (value: string) => void;
  options?: StatusOption[];
  emptyLabel?: string;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState({ top: 0 as number | "auto", bottom: "auto" as number | "auto", left: 0, width: 220, maxHeight: 280 });
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((item) => item.value === value) || null;
  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const rows = options.filter((item) => !needle || item.label.toLowerCase().includes(needle));
    if (emptyLabel && (!needle || emptyLabel.toLowerCase().includes(needle))) {
      return [{ value: "", label: emptyLabel, color: "" }, ...rows];
    }
    return rows;
  }, [options, needle, emptyLabel]);

  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const anchor = box.current;
      if (!anchor) return;
      setPlace(placeList(anchor));
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, matches.length]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (box.current?.contains(target) || list.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const index = matches.findIndex((item) => item.value === value);
    setActive(index >= 0 ? index : 0);
  }, [open, matches, value]);

  function pick(next: string) {
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <div
      className={`status-combo${compact ? " is-compact" : ""}${open ? " is-open" : ""}${!open && selected ? " has-dot" : ""}`}
      data-quiet-skip=""
      ref={box}
    >
      {!open && selected ? <StatusDot color={selected.color} label={selected.label} /> : null}
      <input
        ref={input}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listId}
        disabled={disabled}
        placeholder={open ? placeholder : emptyLabel || placeholder}
        value={open ? query : selected?.label || emptyLabel || ""}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onClick={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
            input.current?.blur();
            return;
          }
          if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            event.preventDefault();
            setOpen(true);
            return;
          }
          if (!open) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(matches.length - 1, index + 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(0, index - 1));
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const item = matches[active];
            if (item) pick(item.value);
          }
        }}
      />
      {open && !disabled
        ? createPortal(
            <ul
              ref={list}
              id={listId}
              className="status-combo-list"
              role="listbox"
              style={{
                top: place.top,
                bottom: place.bottom,
                left: place.left,
                width: place.width,
                maxHeight: place.maxHeight
              }}
            >
              {matches.length ? (
                matches.map((item, index) => (
                  <li key={item.value || "empty"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.value === value}
                      className={`${item.value === value ? "is-selected" : ""}${index === active ? " is-active" : ""}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        pick(item.value);
                      }}
                      onMouseEnter={() => setActive(index)}
                    >
                      {item.color ? <StatusDot color={item.color} label={item.label} /> : <span className="status-dot is-empty" aria-hidden="true" />}
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="status-combo-empty">Geen status gevonden</li>
              )}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
