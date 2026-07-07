import { useEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "../AdminIcons";
import { useAdminTablet } from "../../context/AdminTabletContext";
import { filterSearchItems, type AdminSearchItem } from "../../lib/adminTabletSearch";

interface Props {
  items: AdminSearchItem[];
  onSelect: (item: AdminSearchItem) => void;
  compact?: boolean;
  placeholder?: string;
}

export function AdminTabletSearch({ items, onSelect, compact = false, placeholder = "Zoek onderdeel..." }: Props) {
  const { searchQuery, setSearchQuery } = useAdminTablet();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => filterSearchItems(items, searchQuery).slice(0, 8), [items, searchQuery]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function pick(item: AdminSearchItem) {
    onSelect(item);
    setSearchQuery("");
    setOpen(false);
  }

  return (
    <div className={`ta-tablet-search${compact ? " is-compact" : ""}`} ref={rootRef}>
      <label className="ta-tablet-search-field">
        <IconSearch width={16} height={16} />
        <input
          type="search"
          value={searchQuery}
          placeholder={placeholder}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label={placeholder}
          autoComplete="off"
        />
        {searchQuery ? (
          <button type="button" className="ta-tablet-search-clear" onClick={() => setSearchQuery("")} aria-label="Wissen">
            ×
          </button>
        ) : null}
      </label>

      {open && searchQuery.trim() && results.length ? (
        <ul className="ta-tablet-search-results" role="listbox">
          {results.map((item) => (
            <li key={item.id}>
              <button type="button" role="option" onClick={() => pick(item)}>
                <strong>{item.label}</strong>
                <span>{item.group}</span>
                {item.description ? <em>{item.description}</em> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && searchQuery.trim() && !results.length ? (
        <p className="ta-tablet-search-empty">Geen resultaten voor &ldquo;{searchQuery.trim()}&rdquo;</p>
      ) : null}
    </div>
  );
}
