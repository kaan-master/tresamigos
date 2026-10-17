import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type SearchOption = { id: string; label: string; hint?: string };

type ListPlace = { top: number | 'auto'; bottom: number | 'auto'; left: number; width: number; maxHeight: number };

export function placeAnchoredList(anchor: HTMLElement, wanted = 420): ListPlace {
  const rect = anchor.getBoundingClientRect();
  const gap = 6;
  const below = window.innerHeight - rect.bottom - 12;
  const above = rect.top - 12;
  const openUp = below < 280 && above > below;
  const maxHeight = Math.max(220, Math.min(wanted, openUp ? above : Math.max(below, 220)));
  const width = Math.max(rect.width, 280);
  let left = rect.left;
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
  if (openUp) {
    return { top: 'auto', bottom: window.innerHeight - rect.top + gap, left, width, maxHeight };
  }
  return { top: rect.bottom + gap, bottom: 'auto', left, width, maxHeight };
}

export function SearchPick({
  label,
  ariaLabel,
  selectedLabel,
  placeholder,
  options,
  noneLabel,
  disabled,
  onSelect,
}: {
  label: string;
  ariaLabel?: string;
  selectedLabel: string;
  placeholder: string;
  options: SearchOption[];
  noneLabel: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState<ListPlace>({
    top: 0, bottom: 'auto', left: 0, width: 280, maxHeight: 320,
  });
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const needle = query.trim().toLowerCase();
  const matches = options.filter((item) => !needle || `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(needle));

  useLayoutEffect(() => {
    if (!open) return;
    function placeList() {
      const input = box.current?.querySelector('input');
      if (!input) return;
      setPlace(placeAnchoredList(input));
    }
    placeList();
    window.addEventListener('resize', placeList);
    window.addEventListener('scroll', placeList, true);
    return () => {
      window.removeEventListener('resize', placeList);
      window.removeEventListener('scroll', placeList, true);
    };
  }, [open, matches.length]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (box.current?.contains(target) || list.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  function pick(id: string) {
    onSelect(id);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className={`field search-pick${open ? ' is-open' : ''}`} ref={box}>
      <span>{label}</span>
      <input
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : selectedLabel}
        onFocus={() => { setQuery(''); setOpen(true); }}
        onClick={() => { setQuery(''); setOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      />
      {open && !disabled ? createPortal(
        <ul
          ref={list}
          className="search-pick-list is-portal"
          role="listbox"
          style={{ top: place.top, bottom: place.bottom, left: place.left, width: place.width, maxHeight: place.maxHeight }}
        >
          <li>
            <button type="button" role="option" onMouseDown={(event) => { event.preventDefault(); pick(''); }}>
              {noneLabel}
            </button>
          </li>
          {matches.map((item) => (
            <li key={item.id}>
              <button type="button" role="option" onMouseDown={(event) => { event.preventDefault(); pick(item.id); }}>
                <strong>{item.label}</strong>
                {item.hint ? <small>{item.hint}</small> : null}
              </button>
            </li>
          ))}
          {matches.length === 0 ? <li className="muted">Niets gevonden.</li> : null}
        </ul>,
        document.body,
      ) : null}
    </div>
  );
}
