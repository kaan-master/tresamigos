import { mediaAssetUrl } from "../../lib/media";
import { CATERING_NAV_SECTIONS, type CateringView } from "./cateringNav";

interface Props {
  view: CateringView;
  incomingCount: number;
  onChange: (view: CateringView) => void;
}

export function CateringSubmoduleNav({ view, incomingCount, onChange }: Props) {
  return (
    <nav className="catering-submodule-nav" aria-label="Catering submenu">
      {CATERING_NAV_SECTIONS.map((section) => (
        <div key={section.id} className="catering-submodule-section">
          <p className="catering-submodule-section-label">{section.label}</p>
          <div className="catering-submodule-items">
            {section.items.map((item) => {
              const badgeCount = item.badge && incomingCount > 0 ? incomingCount : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`catering-submodule-item${view === item.id ? " is-active" : ""}`}
                  onClick={() => onChange(item.id)}
                >
                  <span className="catering-submodule-thumb">
                    <img src={mediaAssetUrl(item.image)} alt="" loading="lazy" />
                  </span>
                  <span className="catering-submodule-copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  {badgeCount > 0 ? <em>{badgeCount}</em> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
