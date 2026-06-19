import { useMemo, useState } from "react";
import type { Location, SiteContent } from "@tresamigos/types";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";
import { createSlugId } from "../lib/id";

interface Props {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

function emptyLocation(): Location {
  return {
    id: createSlugId("nieuwe-vestiging", "loc"),
    area: "Amsterdam",
    name: "Nieuwe vestiging",
    address: "",
    note: "Take away and delivery options",
    active: true,
    links: [{ label: "Take Away", url: "" }]
  };
}

export function LocationsPanel({ content, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(content.locations[0]?.id || null);
  const selectedIndex = content.locations.findIndex((location) => location.id === selectedId);
  const location = selectedIndex >= 0 ? content.locations[selectedIndex] : null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return content.locations;
    return content.locations.filter((item) =>
      `${item.name} ${item.area} ${item.address} ${item.note}`.toLowerCase().includes(normalized)
    );
  }, [content.locations, query]);

  function setLocations(locations: Location[]) {
    onChange({ ...content, locations });
  }

  function updateLocation(next: Location) {
    const locations = [...content.locations];
    locations[selectedIndex] = next;
    setLocations(locations);
  }

  function addLocation() {
    const next = emptyLocation();
    setLocations([...content.locations, next]);
    setSelectedId(next.id);
  }

  function removeLocation() {
    if (!location || content.locations.length <= 1) return;
    const locations = content.locations.filter((item) => item.id !== location.id);
    setLocations(locations);
    setSelectedId(locations[0]?.id || null);
  }

  function updateLink(linkIndex: number, field: "label" | "url", value: string) {
    if (!location) return;
    const links = [...location.links];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    updateLocation({ ...location, links });
  }

  function addLink() {
    if (!location) return;
    updateLocation({ ...location, links: [...location.links, { label: "Nieuwe knop", url: "" }] });
  }

  function removeLink(linkIndex: number) {
    if (!location || location.links.length <= 1) return;
    updateLocation({ ...location, links: location.links.filter((_, index) => index !== linkIndex) });
  }

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek vestiging, regio of adres..." />
        <div className="ta-toolbar">
          <button className="ta-btn ta-btn-primary" type="button" onClick={addLocation}>
            + Vestiging
          </button>
        </div>
        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((item) => (
              <AdminListRow
                key={item.id}
                title={item.name}
                meta={`${item.area} · ${item.links.length} knoppen`}
                badge={item.active !== false ? "Actief" : "Verborgen"}
                active={item.id === selectedId}
                onClick={() => setSelectedId(item.id)}
              />
            ))
          ) : (
            <div className="ta-empty">Geen vestigingen gevonden.</div>
          )}
        </div>
      </div>

      {location ? (
        <div className="ta-detail-pane ta-fade-in" key={location.id}>
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">Vestiging bewerken</h3>
            <button className="ta-btn ta-btn-danger" type="button" onClick={removeLocation} disabled={content.locations.length <= 1}>
              Verwijderen
            </button>
          </div>

          <label className="ta-toggle">
            <input
              type="checkbox"
              checked={location.active !== false}
              onChange={(event) => updateLocation({ ...location, active: event.target.checked })}
            />
            <span>Actief op website (footer, contact, order)</span>
          </label>

          <div className="ta-grid">
            <label className="ta-field">
              <span>Naam</span>
              <input value={location.name} onChange={(event) => updateLocation({ ...location, name: event.target.value })} />
            </label>
            <label className="ta-field">
              <span>Regio</span>
              <input value={location.area} onChange={(event) => updateLocation({ ...location, area: event.target.value })} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Adres</span>
              <input value={location.address} onChange={(event) => updateLocation({ ...location, address: event.target.value })} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Notitie</span>
              <input value={location.note} onChange={(event) => updateLocation({ ...location, note: event.target.value })} />
            </label>
          </div>

          <div className="ta-toolbar ta-toolbar-spread" style={{ marginTop: 24 }}>
            <h3 className="ta-section-title">Bestelknoppen</h3>
            <button className="ta-btn ta-btn-ghost" type="button" onClick={addLink}>
              + Knop
            </button>
          </div>
          <div className="ta-link-table">
            {location.links.map((link, linkIndex) => (
              <div className="ta-link-row" key={`${location.id}-${linkIndex}`}>
                <label className="ta-field">
                  <span>Knop</span>
                  <input value={link.label} onChange={(event) => updateLink(linkIndex, "label", event.target.value)} />
                </label>
                <label className="ta-field">
                  <span>URL</span>
                  <input value={link.url} onChange={(event) => updateLink(linkIndex, "url", event.target.value)} />
                </label>
                <button className="ta-btn ta-btn-danger ta-btn-icon" type="button" onClick={() => removeLink(linkIndex)} disabled={location.links.length <= 1}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">Selecteer een vestiging om te bewerken.</div>
      )}
    </div>
  );
}
