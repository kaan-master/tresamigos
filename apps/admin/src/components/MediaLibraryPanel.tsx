import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaAsset, SiteContent } from "@tresamigos/types";
import { deleteMedia, listMedia, uploadMedia } from "../lib/api";
import { mediaAssetUrl } from "../lib/media";
import { AdminButton } from "./AdminButton";
import { IconCopy, IconRefresh, IconTrash, IconUpload } from "./AdminIcons";
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

function cmsImageAssets(content: SiteContent): MediaAsset[] {
  const urls = new Set<string>();

  function add(src?: string, label?: string) {
    if (!src) return;
    const url = normalizeMediaUrl(src);
    if (!url || url.startsWith("http")) return;
    urls.add(JSON.stringify({ url, label: label || url.split("/").pop() || "Afbeelding" }));
  }

  add(content.site.seo.image, "SEO afbeelding");
  add(content.site.ourStory.heroImage, "Our Story hero");
  add(content.site.ourStory.sideImage, "Our Story zijafbeelding");
  add(content.site.vacancy.heroImage, "Vacature hero");
  add(content.site.vacancy.formImage, "Vacature formulier");
  for (const category of content.menu) {
    for (const item of category.items) {
      add(item.image, item.name);
    }
  }

  return [...urls].map((entry) => {
    const parsed = JSON.parse(entry) as { url: string; label: string };
    return {
      url: parsed.url,
      filename: parsed.url.split("/").pop() || parsed.label,
      size: 0,
      section: "cms" as const,
      kind: "image" as const,
      removable: false,
      label: parsed.label
    };
  });
}

function kindLabel(kind: MediaAsset["kind"]) {
  return kind === "video" ? "Video" : "Afbeelding";
}

export function MediaLibraryPanel({ content }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("info");

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await listMedia();
      const merged = [...cmsVideoAssets(content), ...cmsImageAssets(content), ...data.assets];
      const unique = new Map<string, MediaAsset>();
      for (const asset of merged) {
        unique.set(asset.url, asset);
      }
      setAssets([...unique.values()]);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Mediabibliotheek laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets();
  }, [content.videos, content.menu, content.site.seo.image, content.site.ourStory, content.site.vacancy]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filter === "video" && asset.kind !== "video") return false;
      if (filter === "image" && asset.kind !== "image") return false;
      if (filter === "uploads" && asset.section !== "uploads") return false;
      if (filter === "cms" && asset.section !== "cms") return false;
      if (filter === "site" && asset.section !== "site") return false;
      if (filter === "brand" && asset.section !== "brand") return false;
      if (!normalized) return true;
      return `${asset.filename} ${asset.url} ${asset.section} ${asset.label || ""}`.toLowerCase().includes(normalized);
    });
  }, [assets, query, filter]);

  const stats = useMemo(() => {
    const videos = assets.filter((asset) => asset.kind === "video").length;
    const images = assets.filter((asset) => asset.kind === "image").length;
    return { total: assets.length, videos, images };
  }, [assets]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setMessage("");
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      setMessageTone("success");
      setMessage(`¡Olé! ${files.length} bestand(en) geüpload.`);
      await loadAssets();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Upload mislukt.");
    } finally {
      setUploading(false);
      setDragOver(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(asset: MediaAsset) {
    if (!asset.removable) return;
    if (!window.confirm(`Verwijder ${asset.filename}?`)) return;
    try {
      await deleteMedia(asset.url);
      setMessageTone("success");
      setMessage("Bestand verwijderd.");
      await loadAssets();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt.");
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setMessageTone("success");
    setMessage("URL gekopieerd naar klembord.");
  }

  return (
    <div className="ta-media-library">
      <div className="ta-media-stats">
        <article className="ta-media-stat">
          <span>Totaal</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="ta-media-stat">
          <span>Video&apos;s</span>
          <strong>{stats.videos}</strong>
        </article>
        <article className="ta-media-stat">
          <span>Afbeeldingen</span>
          <strong>{stats.images}</strong>
        </article>
      </div>

      <div
        className={`ta-media-dropzone${dragOver ? " is-dragover" : ""}${uploading ? " is-uploading" : ""}`}
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
        <IconUpload width={28} height={28} />
        <strong>Sleep bestanden hierheen</strong>
        <span>of klik op Upload — afbeeldingen en video&apos;s welkom</span>
        <AdminButton variant="primary" loading={uploading} loadingText="Uploaden..." icon={<IconUpload width={16} height={16} />} onClick={() => fileInputRef.current?.click()}>
          Upload
        </AdminButton>
        <input ref={fileInputRef} type="file" hidden multiple accept="image/*,video/*" onChange={(event) => void handleUpload(event.target.files)} />
      </div>

      <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek media, video's of bestandsnamen..." />

      <AdminFilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Alles" },
          { value: "video", label: "Video's" },
          { value: "image", label: "Afbeeldingen" },
          { value: "cms", label: "CMS media" },
          { value: "uploads", label: "Uploads" },
          { value: "site", label: "Site" },
          { value: "brand", label: "Brand" }
        ]}
      />

      <div className="ta-toolbar ta-toolbar-spread">
        <p className="ta-toolbar-note">
          {filtered.length} resultaten · CMS-video&apos;s komen uit het Video&apos;s-tabblad
        </p>
        <AdminButton variant="ghost" icon={<IconRefresh width={16} height={16} />} onClick={() => void loadAssets()}>
          Ververs
        </AdminButton>
      </div>

      {message ? <p className={`ta-inline-toast is-${messageTone}`}>{message}</p> : null}

      {loading ? (
        <div className="ta-media-grid ta-media-grid-loading">
          {Array.from({ length: 6 }).map((_, index) => (
            <article className="ta-media-card is-skeleton" key={`sk-${index}`}>
              <div className="ta-media-preview" />
              <div className="ta-media-meta">
                <strong>&nbsp;</strong>
                <small>&nbsp;</small>
              </div>
            </article>
          ))}
        </div>
      ) : filtered.length ? (
        <div className="ta-media-grid">
          {filtered.map((asset) => (
            <article className="ta-media-card" key={asset.url}>
              <div className="ta-media-preview">
                {asset.kind === "video" ? (
                  <video src={mediaAssetUrl(asset.url)} muted playsInline preload="metadata" />
                ) : (
                  <img src={mediaAssetUrl(asset.url)} alt={asset.label || asset.filename} loading="lazy" />
                )}
                <span className={`ta-media-kind is-${asset.kind}`}>{kindLabel(asset.kind)}</span>
                <div className="ta-media-hover">
                  <AdminButton variant="ghost" icon={<IconCopy width={14} height={14} />} onClick={() => void copyUrl(asset.url)}>
                    Kopieer
                  </AdminButton>
                  {asset.removable ? (
                    <AdminButton variant="danger" icon={<IconTrash width={14} height={14} />} onClick={() => void handleDelete(asset)}>
                      Verwijder
                    </AdminButton>
                  ) : null}
                </div>
              </div>
              <div className="ta-media-meta">
                <strong>{asset.label || asset.filename}</strong>
                <small>
                  {asset.section} · {asset.kind} {asset.size ? `· ${Math.round(asset.size / 1024)} KB` : ""}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ta-empty">Geen media gevonden — upload je eerste taco-foto 🌮</div>
      )}
    </div>
  );
}
