interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function AdminSearchBar({ value, onChange, placeholder = "Zoeken...", label = "Zoeken" }: Props) {
  return (
    <label className="ta-search-bar">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

interface FilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function AdminFilterChips({ value, onChange, options }: FilterProps) {
  return (
    <div className="ta-filter-chips">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ListRowProps {
  title: string;
  meta?: string;
  badge?: string;
  thumb?: string;
  active?: boolean;
  onClick: () => void;
}

export function AdminListRow({ title, meta, badge, thumb, active, onClick }: ListRowProps) {
  return (
    <button type="button" className={`ta-list-row${active ? " is-active" : ""}`} onClick={onClick}>
      {thumb ? (
        <span className="ta-list-row-thumb">
          <img src={thumb} alt="" loading="lazy" />
        </span>
      ) : null}
      <span className="ta-list-row-copy">
        <strong>{title}</strong>
        {meta ? <small>{meta}</small> : null}
      </span>
      {badge ? <span className="ta-status">{badge}</span> : null}
    </button>
  );
}
