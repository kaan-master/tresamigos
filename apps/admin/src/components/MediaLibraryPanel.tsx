import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaAsset, SiteContent } from "@tresamigos/types";
import { deleteMedia, listMedia, uploadMedia } from "../lib/api";
import { AdminFilterChips, AdminSearchBar } from "./AdminListUi";

interface Props {
  content: SiteContent;
}

function normalizeMediaUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function cmsVideoAssets(content: SiteContent): MediaAsset[] {
  return content.videos.map((video) => {
    const url = normalizeMediaUrl(video.src);
    const filename = url.split("/").pop() || video.title;
    return {
      url,
      filename,
      size: 0,
      section: "cms",
      kind: "video",
      removable: false,
      label: video.title
    };
  });
}

export function MediaLibraryPanel({ content }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await listMedia();
      const merged = [...cmsVideoAssets(content), ...data.assets];
      const unique = new Map<string, MediaAsset>();
      for (const asset of merged) {
        unique.set(asset.url, asset);
      }
      setAssets([...unique.values()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mediabibliotheek laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets();
  }, [content.videos]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filter === "video" && asset.kind !== "video") return false;
      if (filter === "image" && asset.kind !== "image") return false;
      if (filter === "uploads" && asset.section !== "uploads") return false;
      if (filter === "cms" && asset.section !== "cms") return false;
      if (!normalized) return true;
      return `${asset.filename} ${asset.url} ${asset.section} ${asset.label || ""}`.toLowerCase().includes(normalized);
    });
  }, [assets, query, filter]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMessage("");
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      setMessage(`${files.length} bestand(en) geüpload.`);
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload mislukt.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(asset: MediaAsset) {
    if (!asset.removable) return;
    if (!window.confirm(`Verwijder ${asset.filename}?`)) return;
    try {
      await deleteMedia(asset.url);
      setMessage("Bestand verwijderd.");
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt.");
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage("URL gekopieerd.");
  }

  return (
    <div className="ta-media-library">
      <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek media, video's of bestandsnamen..." />

      <AdminFilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Alles" },
          { value: "video", label: "Video's" },
          { value: "image", label: "Afbeeldingen" },
          { value: "cms", label: "CMS video's" },
          { value: "uploads", label: "Uploads" }
        ]}
      />

      <div className="ta-toolbar ta-toolbar-spread">
        <p className="ta-seo-hint" style={{ margin: 0 }}>
          {filtered.length} resultaten · CMS-video&apos;s komen uit het Video&apos;s-tabblad
        </p>
        <div className="ta-toolbar">
          <button className="ta-btn ta-btn-ghost" type="button" onClick={() => void loadAssets()}>
            Ververs
          </button>
          <button className="ta-btn ta-btn-primary" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploaden..." : "Upload"}
          </button>
          <input ref={fileInputRef} type="file" hidden multiple accept="image/*,video/*" onChange={(event) => void handleUpload(event.target.files)} />
        </div>
      </div>

      {message ? <p className="ta-seo-hint">{message}</p> : null}

      {loading ? (
        <div className="ta-empty">Mediabibliotheek laden...</div>
      ) : filtered.length ? (
        <div className="ta-media-grid">
          {filtered.map((asset) => (
            <article className="ta-media-card" key={asset.url}>
              <div className="ta-media-preview">
                {asset.kind === "video" ? (
                  <video src={asset.url} muted playsInline preload="metadata" />
                ) : (
                  <img src={asset.url} alt={asset.label || asset.filename} />
                )}
              </div>
              <div className="ta-media-meta">
                <strong>{asset.label || asset.filename}</strong>
                <small>
                  {asset.section} · {asset.kind} {asset.size ? `· ${Math.round(asset.size / 1024)} KB` : ""}
                </small>
              </div>
              <div className="ta-toolbar">
                <button className="ta-btn ta-btn-ghost" type="button" onClick={() => void copyUrl(asset.url)}>
                  Kopieer URL
                </button>
                {asset.removable ? (
                  <button className="ta-btn ta-btn-danger" type="button" onClick={() => void handleDelete(asset)}>
                    Verwijder
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ta-empty">Geen media gevonden.</div>
      )}
    </div>
  );
}
