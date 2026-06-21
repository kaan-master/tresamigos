import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaAsset } from "@tresamigos/types";
import { listMedia, uploadMedia } from "../lib/api";
import { mediaAssetUrl } from "../lib/media";
import { AdminButton } from "./AdminButton";
import { IconUpload } from "./AdminIcons";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  async function loadAssets() {
    setLoading(true);
    setError("");
    try {
      const data = await listMedia();
      setAssets(data.assets);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Media laden mislukt.");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadAssets();
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

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      let lastUrl = "";
      for (const file of Array.from(files)) {
        const result = await uploadMedia(file);
        lastUrl = result.asset.url;
      }
      await loadAssets();
      if (lastUrl) onSelect(normalizePick(lastUrl));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload mislukt.");
    } finally {
      setUploading(false);
      setDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!open) return null;

  return (
    <div className="ta-media-modal" role="dialog" aria-modal="true" aria-label="Media kiezen">
      <button className="ta-media-modal-backdrop" type="button" aria-label="Sluiten" onClick={onClose} />
      <div className="ta-media-modal-panel">
        <header className="ta-media-modal-head">
          <div>
            <h3>Media plaza</h3>
            <p>Kies uit de bibliotheek of upload direct een nieuw bestand.</p>
          </div>
          <button className="ta-btn ta-btn-ghost" type="button" onClick={onClose}>
            Sluiten
          </button>
        </header>

        <div
          className={`ta-media-dropzone ta-media-dropzone-compact${dragOver ? " is-dragover" : ""}${uploading ? " is-uploading" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            void handleUpload(event.dataTransfer.files);
          }}
        >
          <IconUpload width={22} height={22} />
          <span>Sleep hierheen of upload — daarna direct geselecteerd</span>
          <AdminButton
            variant="primary"
            loading={uploading}
            loadingText="Uploaden..."
            icon={<IconUpload width={16} height={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </AdminButton>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept={filter === "video" ? "video/*" : filter === "image" ? "image/*" : "image/*,video/*"}
            onChange={(event) => void handleUpload(event.target.files)}
          />
        </div>

        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek bestandsnaam..." />

        {error ? <div className="ta-alert is-error">{error}</div> : null}

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
                    <video src={mediaAssetUrl(asset.url)} muted playsInline preload="metadata" />
                  ) : (
                    <img src={mediaAssetUrl(asset.url)} alt={asset.label || asset.filename} loading="lazy" />
                  )}
                </div>
                <span>{asset.label || asset.filename}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ta-empty">Geen media gevonden. Upload een bestand hierboven.</div>
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
  const preview = mediaAssetUrl(value);

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
