import { useMemo, useState } from "react";
import type { SiteContent, Video } from "@tresamigos/types";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";
import { MediaField } from "./MediaPickerModal";
import { createSlugId } from "../lib/id";

interface Props {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

function emptyVideo(): Video {
  return {
    id: createSlugId("video", "video"),
    title: "Nieuwe video",
    caption: "",
    src: "assets/brand/Tres amigos vid 5.mp4",
    active: true
  };
}

export function VideosPanel({ content, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(content.videos[0]?.id || null);
  const selectedIndex = content.videos.findIndex((video) => video.id === selectedId);
  const video = selectedIndex >= 0 ? content.videos[selectedIndex] : null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return content.videos;
    return content.videos.filter((item) =>
      `${item.title} ${item.caption} ${item.src}`.toLowerCase().includes(normalized)
    );
  }, [content.videos, query]);

  function setVideos(videos: Video[]) {
    onChange({ ...content, videos });
  }

  function updateVideo(next: Video) {
    const videos = [...content.videos];
    videos[selectedIndex] = next;
    setVideos(videos);
  }

  function addVideo() {
    const next = emptyVideo();
    setVideos([...content.videos, next]);
    setSelectedId(next.id);
  }

  function removeVideo() {
    if (!video) return;
    const videos = content.videos.filter((item) => item.id !== video.id);
    setVideos(videos);
    setSelectedId(videos[0]?.id || null);
  }

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek video titel of URL..." />
        <div className="ta-toolbar">
          <button className="ta-btn ta-btn-primary" type="button" onClick={addVideo}>
            + Video
          </button>
        </div>
        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((item) => (
              <AdminListRow
                key={item.id}
                title={item.title}
                meta={item.src}
                badge={item.active !== false ? "Actief" : "Verborgen"}
                active={item.id === selectedId}
                onClick={() => setSelectedId(item.id)}
              />
            ))
          ) : (
            <div className="ta-empty">Geen video&apos;s gevonden.</div>
          )}
        </div>
      </div>

      {video ? (
        <div className="ta-detail-pane ta-fade-in" key={video.id}>
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">Video bewerken</h3>
            <button className="ta-btn ta-btn-danger" type="button" onClick={removeVideo}>
              Verwijderen
            </button>
          </div>

          <video
            src={video.src.startsWith("/") ? video.src : `/${video.src}`}
            muted
            playsInline
            preload="metadata"
            className="ta-video-preview"
            controls
          />

          <label className="ta-toggle">
            <input type="checkbox" checked={video.active !== false} onChange={(event) => updateVideo({ ...video, active: event.target.checked })} />
            <span>Actief op website</span>
          </label>

          <div className="ta-grid">
            <label className="ta-field ta-grid-wide">
              <span>Titel</span>
              <input value={video.title} onChange={(event) => updateVideo({ ...video, title: event.target.value })} />
            </label>
            <MediaField
              label="Video bestand"
              value={video.src}
              filter="video"
              onChange={(value) => updateVideo({ ...video, src: value })}
            />
            <label className="ta-field ta-grid-wide">
              <span>Caption</span>
              <input value={video.caption} onChange={(event) => updateVideo({ ...video, caption: event.target.value })} />
            </label>
          </div>
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">Selecteer een video om te bewerken.</div>
      )}
    </div>
  );
}
