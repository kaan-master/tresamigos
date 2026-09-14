import type { ComponentType, ReactNode, SVGProps } from "react";

export type EntraNavItem<T extends string = string> = {
  id: T;
  label: string;
  hint: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  section?: string;
};

function groupedNavItems<T extends string>(items: Array<EntraNavItem<T>>, fallbackSection: string) {
  const groups: Array<{ section: string; items: Array<EntraNavItem<T>> }> = [];
  for (const item of items) {
    const section = item.section || fallbackSection;
    const current = groups[groups.length - 1];
    if (!current || current.section !== section) {
      groups.push({ section, items: [item] });
    } else {
      current.items.push(item);
    }
  }
  return groups;
}

export function EntraShell<T extends string>({
  brand,
  sectionLabel = "Beheren",
  items,
  view,
  onChange,
  title,
  subtitle,
  children
}: {
  brand: string;
  sectionLabel?: string;
  items: Array<EntraNavItem<T>>;
  view: T;
  onChange: (view: T) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="entra-shell">
      <aside className="entra-nav">
        {groupedNavItems(items, sectionLabel).map((group) => (
          <div className="entra-nav-group" key={group.section}>
            <p>{group.section}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? "is-active" : ""}
                onClick={() => onChange(item.id)}
              >
                <item.Icon width={18} height={18} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
        ))}
      </aside>
      <div className="entra-main">
        <header className="entra-head">
          <span>{brand}</span>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

export function EntraCommands({ children }: { children: ReactNode }) {
  return <div className="entra-commands">{children}</div>;
}

export function EntraCommand({
  children,
  onClick,
  disabled,
  danger,
  active
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`entra-cmd${danger ? " is-danger" : ""}${active ? " is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function EntraSearch({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="entra-search">
      <span>Zoeken</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function EntraBlade({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="entra-blade-wrap">
      <button type="button" className="entra-blade-dim" aria-label="Sluiten" onClick={onClose} />
      <aside className="entra-blade">
        <header>
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            Sluiten
          </button>
        </header>
        <div className="entra-blade-body">{children}</div>
      </aside>
    </div>
  );
}
