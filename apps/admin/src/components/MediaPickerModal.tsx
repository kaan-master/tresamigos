import { useEffect, useMemo, useState } from "react";
import type { MediaAsset } from "@tresamigos/types";
import { listMedia } from "../lib/api";
import { AdminSearchBar } from "./AdminListUi";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  filter?: "all" | "image" | "video";
}

function normalizePick(url: string) {
  return url.startsWith("/") ? url.slice(1) : url;
}

export function MediaPickerModal({ open, onClose, onSelect, filter = "image" }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    void listMedia()
      .then((data) => {
        if (active) setAssets(data.assets);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filter === "image" && asset.kind !== "image") return false;
      if (filter === "video" && asset.kind !== "video") return false;
      if (!normalized) return true;
      return `${asset.filename} ${asset.url} ${asset.label || ""}`.toLowerCase().includes(normalized);
    });
  }, [assets, query, filter]);

  if (!open) return null;

  return (
    <div className="ta-media-modal" role="dialog" aria-modal="true" aria-label="Media kiezen">
      <button className="ta-media-modal-backdrop" type="button" aria-label="Sluiten" onClick={onClose} />
      <div className="ta-media-modal-panel">
        <header className="ta-media-modal-head">
          <div>
            <h3>Media plaza</h3>
            <p>Kies een afbeelding of video uit uploads, site of brand assets.</p>
          </div>
          <button className="ta-btn ta-btn-ghost" type="button" onClick={onClose}>
            Sluiten
          </button>
        </header>

        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek bestandsnaam..." />

        {loading ? (
          <div className="ta-empty">Media laden...</div>
        ) : filtered.length ? (
          <div className="ta-media-picker-grid">
            {filtered.map((asset) => (
              <button
                className="ta-media-picker-item"
                type="button"
                key={asset.url}
                onClick={() => onSelect(normalizePick(asset.url))}
              >
                <div className="ta-media-preview">
                  {asset.kind === "video" ? (
                    <video src={asset.url} muted playsInline preload="metadata" />
                  ) : (
                    <img src={asset.url} alt={asset.label || asset.filename} loading="lazy" />
                  )}
                </div>
                <span>{asset.label || asset.filename}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ta-empty">Geen media gevonden.</div>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filter?: "all" | "image" | "video";
}

export function MediaField({ label, value, onChange, placeholder, filter = "image" }: FieldProps) {
  const [open, setOpen] = useState(false);
  const preview = value ? (value.startsWith("/") ? value : `/${value}`) : "";

  return (
    <>
      <label className="ta-field ta-grid-wide">
        <span>{label}</span>
        <div className="ta-media-field">
          <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
          <button className="ta-btn ta-btn-ghost" type="button" onClick={() => setOpen(true)}>
            Kies media
          </button>
        </div>
        {preview ? <img className="ta-product-preview" src={preview} alt="" loading="lazy" /> : null}
      </label>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        filter={filter}
        onSelect={(url) => {
          onChange(url);
          setOpen(false);
        }}
      />
    </>
  );
}
