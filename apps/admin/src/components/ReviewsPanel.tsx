import { useEffect, useMemo, useState } from "react";
import type { ReviewSubmission, SiteContent } from "@tresamigos/types";
import { api } from "../lib/api";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "./AdminListUi";
import { MediaField } from "./MediaPickerModal";
import { createSlugId } from "../lib/id";

interface Props {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

type PanelView = "moderation" | "settings" | "instagram";

function updateSite(content: SiteContent, patch: Partial<SiteContent["site"]>) {
  return { ...content, site: { ...content.site, ...patch } };
}

function statusLabel(status: ReviewSubmission["status"]) {
  if (status === "approved") return "Goedgekeurd";
  if (status === "spam") return "Spam";
  return "In afwachting";
}

function ModerationView() {
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api<ReviewSubmission[]>("/api/admin/review-submissions");
      setSubmissions(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reviews laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return submissions.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!normalized) return true;
      return `${item.author} ${item.email} ${item.text} ${item.status}`.toLowerCase().includes(normalized);
    });
  }, [submissions, query, filter]);

  const selected =
    filtered.find((item) => item.id === selectedId) || submissions.find((item) => item.id === selectedId) || null;

  async function setStatus(id: string, status: ReviewSubmission["status"]) {
    try {
      await api<ReviewSubmission>(`/api/admin/review-submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setMessage(status === "approved" ? "Review goedgekeurd en zichtbaar in slider." : "Review gemarkeerd als spam.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status bijwerken mislukt.");
    }
  }

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek naam, e-mail of tekst..." />
        <AdminFilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "pending", label: "In afwachting" },
            { value: "approved", label: "Goedgekeurd" },
            { value: "spam", label: "Spam" },
            { value: "all", label: "Alles" }
          ]}
        />
        <div className="ta-toolbar ta-toolbar-spread">
          <p className="ta-seo-hint" style={{ margin: 0 }}>
            {filtered.length} review(s)
          </p>
          <button className="ta-btn ta-btn-ghost" type="button" onClick={() => void load()}>
            Ververs
          </button>
        </div>
        {message ? <p className="ta-seo-hint">{message}</p> : null}
        <div className="ta-list-scroll">
          {loading ? (
            <div className="ta-empty">Reviews laden...</div>
          ) : filtered.length ? (
            filtered.map((item) => (
              <AdminListRow
                key={item.id}
                title={item.author}
                meta={`${statusLabel(item.status)} · ${"★".repeat(item.rating)} · ${item.text.slice(0, 72)}${item.text.length > 72 ? "…" : ""}`}
                active={item.id === selectedId}
                onClick={() => setSelectedId(item.id)}
              />
            ))
          ) : (
            <div className="ta-empty">Geen reviews in deze filter.</div>
          )}
        </div>
      </div>

      <div className="ta-detail-pane ta-fade-in" key={selected?.id || "empty"}>
        {selected ? (
          <>
            <h3 className="ta-section-title">{selected.author}</h3>
            <p className="ta-seo-hint">
              {statusLabel(selected.status)} · {selected.rating} sterren · {new Date(selected.createdAt).toLocaleString("nl-NL")}
            </p>
            {selected.email ? <p className="ta-seo-hint">E-mail: {selected.email}</p> : null}
            <article className="ta-review-detail">{selected.text}</article>
            <div className="ta-toolbar">
              {selected.status !== "approved" ? (
                <button className="ta-btn ta-btn-primary" type="button" onClick={() => void setStatus(selected.id, "approved")}>
                  Accepteren
                </button>
              ) : null}
              {selected.status !== "spam" ? (
                <button className="ta-btn ta-btn-danger" type="button" onClick={() => void setStatus(selected.id, "spam")}>
                  Spam / negeren
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="ta-empty">Kies links een review om te modereren.</div>
        )}
      </div>
    </div>
  );
}

function SettingsView({ content, onChange }: Props) {
  const reviews = content.site.reviews;

  return (
    <div className="ta-grid">
      <label className="ta-field">
        <span>Sectie aan</span>
        <select
          value={reviews.enabled ? "yes" : "no"}
          onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, enabled: event.target.value === "yes" } }))}
        >
          <option value="yes">Ja</option>
          <option value="no">Nee</option>
        </select>
      </label>
      <label className="ta-field">
        <span>Formulier aan</span>
        <select
          value={reviews.submitEnabled ? "yes" : "no"}
          onChange={(event) =>
            onChange(updateSite(content, { reviews: { ...reviews, submitEnabled: event.target.value === "yes" } }))
          }
        >
          <option value="yes">Ja</option>
          <option value="no">Nee</option>
        </select>
      </label>
      <label className="ta-field">
        <span>Google Place ID</span>
        <input
          value={reviews.googlePlaceId}
          onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, googlePlaceId: event.target.value } }))}
        />
      </label>
      <label className="ta-field">
        <span>Min. sterren</span>
        <input
          type="number"
          min={1}
          max={5}
          value={reviews.minRating}
          onChange={(event) =>
            onChange(updateSite(content, { reviews: { ...reviews, minRating: Number(event.target.value) || 4 } }))
          }
        />
      </label>
      <label className="ta-field">
        <span>Eyebrow</span>
        <input value={reviews.eyebrow} onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, eyebrow: event.target.value } }))} />
      </label>
      <label className="ta-field">
        <span>Titel slider</span>
        <input value={reviews.title} onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, title: event.target.value } }))} />
      </label>
      <label className="ta-field ta-grid-wide">
        <span>Formulier titel</span>
        <input
          value={reviews.submitTitle}
          onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, submitTitle: event.target.value } }))}
        />
      </label>
      <label className="ta-field ta-grid-wide">
        <span>Formulier intro</span>
        <textarea
          rows={3}
          value={reviews.submitIntro}
          onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, submitIntro: event.target.value } }))}
        />
      </label>
      <label className="ta-field ta-grid-wide">
        <span>Succesbericht</span>
        <input
          value={reviews.submitSuccessMessage}
          onChange={(event) =>
            onChange(updateSite(content, { reviews: { ...reviews, submitSuccessMessage: event.target.value } }))
          }
        />
      </label>
      <p className="ta-seo-hint ta-grid-wide">
        Vaste reviews staan hieronder. Goedgekeurde inzendingen uit moderatie worden automatisch aan de slider toegevoegd.
      </p>
      {reviews.curated.map((review, index) => (
        <div className="ta-grid-wide ta-review-curated-row" key={review.id}>
          <label className="ta-field">
            <span>Naam</span>
            <input
              value={review.author}
              onChange={(event) => {
                const curated = [...reviews.curated];
                curated[index] = { ...curated[index], author: event.target.value };
                onChange(updateSite(content, { reviews: { ...reviews, curated } }));
              }}
            />
          </label>
          <label className="ta-field">
            <span>Sterren</span>
            <input
              type="number"
              min={1}
              max={5}
              value={review.rating}
              onChange={(event) => {
                const curated = [...reviews.curated];
                curated[index] = { ...curated[index], rating: Number(event.target.value) || 5 };
                onChange(updateSite(content, { reviews: { ...reviews, curated } }));
              }}
            />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Reviewtekst</span>
            <textarea
              rows={3}
              value={review.text}
              onChange={(event) => {
                const curated = [...reviews.curated];
                curated[index] = { ...curated[index], text: event.target.value };
                onChange(updateSite(content, { reviews: { ...reviews, curated } }));
              }}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

function InstagramView({ content, onChange }: Props) {
  const instagram = content.site.instagram;

  function updateInstagram(patch: Partial<SiteContent["site"]["instagram"]>) {
    onChange(updateSite(content, { instagram: { ...instagram, ...patch } }));
  }

  function updatePost(index: number, patch: Partial<(typeof instagram.posts)[number]>) {
    const posts = [...instagram.posts];
    posts[index] = { ...posts[index], ...patch };
    updateInstagram({ posts });
  }

  function addPost() {
    const caption = "Nieuwe post";
    updateInstagram({
      posts: [
        ...instagram.posts,
        {
          id: createSlugId(caption, "ig"),
          image: "assets/site/restaurant-interior.jpg",
          url: instagram.profileUrl,
          caption,
          active: true
        }
      ]
    });
  }

  return (
    <div className="ta-grid">
      <label className="ta-field">
        <span>Instagram sectie aan</span>
        <select
          value={instagram.enabled ? "yes" : "no"}
          onChange={(event) => updateInstagram({ enabled: event.target.value === "yes" })}
        >
          <option value="yes">Ja</option>
          <option value="no">Nee</option>
        </select>
      </label>
      <label className="ta-field">
        <span>Handle</span>
        <input value={instagram.handle} onChange={(event) => updateInstagram({ handle: event.target.value.replace(/^@/, "") })} />
      </label>
      <label className="ta-field ta-grid-wide">
        <span>Profiel URL</span>
        <input value={instagram.profileUrl} onChange={(event) => updateInstagram({ profileUrl: event.target.value })} />
      </label>
      <label className="ta-field">
        <span>Eyebrow</span>
        <input value={instagram.eyebrow} onChange={(event) => updateInstagram({ eyebrow: event.target.value })} />
      </label>
      <label className="ta-field">
        <span>Titel</span>
        <input value={instagram.title} onChange={(event) => updateInstagram({ title: event.target.value })} />
      </label>
      <label className="ta-field ta-grid-wide">
        <span>Bio</span>
        <input value={instagram.bio} onChange={(event) => updateInstagram({ bio: event.target.value })} />
      </label>
      <p className="ta-seo-hint ta-grid-wide">
        Live feed wordt automatisch opgehaald van @{instagram.handle || "handle"} via Instagram API. Fallback-posts hieronder
        worden alleen gebruikt als de live feed tijdelijk niet beschikbaar is. Optioneel: zet{" "}
        <code>INSTAGRAM_ACCESS_TOKEN</code> in .env voor de stabielste koppeling (Meta Business).
      </p>

      <div className="ta-grid-wide ta-toolbar ta-toolbar-spread">
        <h3 className="ta-section-title" style={{ margin: 0 }}>
          Posts
        </h3>
        <button className="ta-btn ta-btn-primary" type="button" onClick={addPost}>
          Post toevoegen
        </button>
      </div>

      {instagram.posts.map((post: SiteContent["site"]["instagram"]["posts"][number], index: number) => (
        <div className="ta-grid-wide ta-review-curated-row" key={post.id}>
          <MediaField
            label={`Post ${index + 1} afbeelding`}
            value={post.image}
            onChange={(value) => updatePost(index, { image: value })}
          />
          <label className="ta-field">
            <span>Link naar post</span>
            <input value={post.url} onChange={(event) => updatePost(index, { url: event.target.value })} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Caption</span>
            <input value={post.caption} onChange={(event) => updatePost(index, { caption: event.target.value })} />
          </label>
          <label className="ta-field">
            <span>Actief</span>
            <select
              value={post.active === false ? "no" : "yes"}
              onChange={(event) => updatePost(index, { active: event.target.value === "yes" })}
            >
              <option value="yes">Ja</option>
              <option value="no">Nee</option>
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}

export function ReviewsPanel({ content, onChange }: Props) {
  const [view, setView] = useState<PanelView>("moderation");

  return (
    <div>
      <AdminFilterChips
        value={view}
        onChange={(value) => setView(value as PanelView)}
        options={[
          { value: "moderation", label: "Moderatie" },
          { value: "settings", label: "Instellingen" },
          { value: "instagram", label: "Instagram" }
        ]}
      />

      {view === "moderation" ? <ModerationView /> : null}
      {view === "settings" ? <SettingsView content={content} onChange={onChange} /> : null}
      {view === "instagram" ? <InstagramView content={content} onChange={onChange} /> : null}
    </div>
  );
}
