import { useMemo, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { AdminFilterChips, AdminSearchBar } from "./AdminListUi";
import { MediaField } from "./MediaPickerModal";

type HomeView = "hero" | "hours" | "story";

function updateSite(content: SiteContent, patch: Partial<SiteContent["site"]>) {
  return { ...content, site: { ...content.site, ...patch } };
}

function HeroSection({ content, onChange }: { content: SiteContent; onChange: (c: SiteContent) => void }) {
  const hero = content.site.hero;
  const navCta = content.site.navCta;

  return (
    <div className="ta-home-stack">
      <article className="ta-home-card">
        <header className="ta-home-card-head">
          <h3>Hero tekst</h3>
          <p>De grote kop en intro bovenaan de homepage.</p>
        </header>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Eyebrow</span>
            <input
              value={hero.eyebrow}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, eyebrow: event.target.value } }))}
            />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Titel</span>
            <input
              value={hero.title}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, title: event.target.value } }))}
            />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Intro</span>
            <textarea
              rows={3}
              value={hero.intro}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, intro: event.target.value } }))}
            />
          </label>
        </div>
      </article>

      <article className="ta-home-card">
        <header className="ta-home-card-head">
          <h3>Hero knoppen</h3>
          <p>Primaire en secundaire actie op de homepage.</p>
        </header>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Primaire knop</span>
            <input
              value={hero.primaryLabel}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, primaryLabel: event.target.value } }))}
            />
          </label>
          <label className="ta-field">
            <span>Primaire link</span>
            <input
              value={hero.primaryUrl}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, primaryUrl: event.target.value } }))}
            />
          </label>
          <label className="ta-field">
            <span>Secundaire knop</span>
            <input
              value={hero.secondaryLabel}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, secondaryLabel: event.target.value } }))}
            />
          </label>
          <label className="ta-field">
            <span>Secundaire link</span>
            <input
              value={hero.secondaryUrl}
              onChange={(event) => onChange(updateSite(content, { hero: { ...hero, secondaryUrl: event.target.value } }))}
            />
          </label>
        </div>
      </article>

      <article className="ta-home-card">
        <header className="ta-home-card-head">
          <h3>Navigatie & tags</h3>
          <p>Order-knop in de menubalk en highlight-tags op de hero.</p>
        </header>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Nav CTA label</span>
            <input
              value={navCta.label}
              onChange={(event) => onChange(updateSite(content, { navCta: { ...navCta, label: event.target.value } }))}
            />
          </label>
          <label className="ta-field">
            <span>Nav CTA link</span>
            <input
              value={navCta.url}
              onChange={(event) => onChange(updateSite(content, { navCta: { ...navCta, url: event.target.value } }))}
            />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Hero tags (komma gescheiden)</span>
            <input
              value={hero.tags.join(", ")}
              onChange={(event) =>
                onChange(
                  updateSite(content, {
                    hero: {
                      ...hero,
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    }
                  })
                )
              }
            />
          </label>
        </div>
        {hero.tags.length ? (
          <div className="ta-tag-preview">
            {hero.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}

function OpeningHoursSection({ content, onChange }: { content: SiteContent; onChange: (c: SiteContent) => void }) {
  const hours = content.site.openingHours;

  function patchHours(patch: Partial<typeof hours>) {
    onChange(updateSite(content, { openingHours: { ...hours, ...patch } }));
  }

  return (
    <div className="ta-hours-layout">
      <div className="ta-home-stack">
        <article className="ta-home-card">
          <header className="ta-home-card-head ta-home-card-head-row">
            <div>
              <h3>Openingstijden</h3>
              <p>Wordt getoond op de homepage en in de footer.</p>
            </div>
            <label className="ta-toggle ta-toggle-inline">
              <input type="checkbox" checked={hours.enabled !== false} onChange={(event) => patchHours({ enabled: event.target.checked })} />
              <span>{hours.enabled !== false ? "Zichtbaar op site" : "Verborgen"}</span>
            </label>
          </header>

          <div className="ta-grid">
            <label className="ta-field">
              <span>Eyebrow</span>
              <input value={hours.eyebrow} onChange={(event) => patchHours({ eyebrow: event.target.value })} />
            </label>
            <label className="ta-field">
              <span>Kaart titel</span>
              <input value={hours.title} onChange={(event) => patchHours({ title: event.target.value })} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Samenvatting</span>
              <input value={hours.summary} onChange={(event) => patchHours({ summary: event.target.value })} placeholder="Open 7 days a week" />
            </label>
            <label className="ta-field">
              <span>Sectielabel</span>
              <input value={hours.sectionLabel} onChange={(event) => patchHours({ sectionLabel: event.target.value })} />
            </label>
          </div>
        </article>

        <article className="ta-home-card">
          <header className="ta-home-card-head">
            <h3>Tijden per periode</h3>
            <p>Groepeer dagen zoals op Google: bijv. Mon–Thu, Fri–Sat, Sun.</p>
          </header>

          <div className="ta-hours-table-wrap">
            <table className="ta-hours-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Openingstijden</th>
                  <th aria-label="Acties" />
                </tr>
              </thead>
              <tbody>
                {hours.groups.map((group, index) => (
                  <tr key={`${group.label}-${index}`}>
                    <td>
                      <input
                        className="ta-hours-cell-input"
                        value={group.label}
                        placeholder="Mon–Thu"
                        onChange={(event) => {
                          const groups = [...hours.groups];
                          groups[index] = { ...groups[index], label: event.target.value };
                          patchHours({ groups });
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="ta-hours-cell-input"
                        value={group.hours}
                        placeholder="11 am – 10:30 pm"
                        onChange={(event) => {
                          const groups = [...hours.groups];
                          groups[index] = { ...groups[index], hours: event.target.value };
                          patchHours({ groups });
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="ta-btn ta-btn-ghost ta-btn-icon"
                        type="button"
                        aria-label="Rij verwijderen"
                        onClick={() => patchHours({ groups: hours.groups.filter((_, i) => i !== index) })}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="ta-btn ta-btn-ghost"
            type="button"
            onClick={() => patchHours({ groups: [...hours.groups, { label: "Nieuwe periode", hours: "11 am – 10 pm" }] })}
          >
            + Periode toevoegen
          </button>
        </article>

        <article className="ta-home-card">
          <header className="ta-home-card-head">
            <h3>Call-to-action</h3>
            <p>Knop onder de openingstijden op de homepage.</p>
          </header>
          <div className="ta-grid">
            <label className="ta-field">
              <span>Knoptekst</span>
              <input value={hours.ctaLabel} onChange={(event) => patchHours({ ctaLabel: event.target.value })} />
            </label>
            <label className="ta-field">
              <span>Link</span>
              <input value={hours.ctaUrl} onChange={(event) => patchHours({ ctaUrl: event.target.value })} />
            </label>
          </div>
        </article>
      </div>

      <aside className="ta-hours-preview-wrap">
        <p className="ta-hours-preview-label">Live preview</p>
        <div className={`ta-hours-preview${hours.enabled === false ? " is-disabled" : ""}`}>
          <span className="ta-hours-preview-eyebrow">{hours.eyebrow || "Eyebrow"}</span>
          <strong className="ta-hours-preview-title">{hours.title || "Titel"}</strong>
          <div className="ta-hours-preview-block">
            <span className="ta-hours-preview-section">{hours.sectionLabel || "Open Hours"}</span>
            {hours.summary ? <p className="ta-hours-preview-summary">{hours.summary}</p> : null}
            <dl className="ta-hours-preview-list">
              {hours.groups.length ? (
                hours.groups.map((group, index) => (
                  <div className="ta-hours-preview-row" key={`${group.label}-${index}`}>
                    <dt>{group.label || "—"}</dt>
                    <dd>{group.hours || "—"}</dd>
                  </div>
                ))
              ) : (
                <div className="ta-hours-preview-empty">Voeg minimaal één periode toe.</div>
              )}
            </dl>
          </div>
          <span className="ta-hours-preview-cta">{hours.ctaLabel || "Order now"}</span>
        </div>
      </aside>
    </div>
  );
}

function StorySection({ content, onChange }: { content: SiteContent; onChange: (c: SiteContent) => void }) {
  const story = content.site.ourStory;
  const [query, setQuery] = useState("");

  const filteredIndexes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return story.paragraphs
      .map((paragraph, index) => ({ paragraph, index }))
      .filter(({ paragraph }) => !normalized || paragraph.toLowerCase().includes(normalized));
  }, [story.paragraphs, query]);

  function patchStory(patch: Partial<typeof story>) {
    onChange(updateSite(content, { ourStory: { ...story, ...patch } }));
  }

  return (
    <div className="ta-home-stack">
      <article className="ta-home-card">
        <header className="ta-home-card-head">
          <h3>Our Story — pagina</h3>
          <p>Hero en intro van de verhalenpagina.</p>
        </header>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Eyebrow</span>
            <input value={story.eyebrow} onChange={(event) => patchStory({ eyebrow: event.target.value })} />
          </label>
          <label className="ta-field">
            <span>Titel</span>
            <input value={story.title} onChange={(event) => patchStory({ title: event.target.value })} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Intro</span>
            <textarea rows={3} value={story.intro} onChange={(event) => patchStory({ intro: event.target.value })} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Openingstijden op verhalenpagina</span>
            <input value={story.scheduleSummary} onChange={(event) => patchStory({ scheduleSummary: event.target.value })} />
          </label>
          <MediaField label="Hero afbeelding" value={story.heroImage} onChange={(value) => patchStory({ heroImage: value })} />
          <MediaField label="Zij-afbeelding" value={story.sideImage} onChange={(value) => patchStory({ sideImage: value })} />
        </div>
      </article>

      <article className="ta-home-card">
        <header className="ta-home-card-head ta-home-card-head-row">
          <div>
            <h3>Alinea&apos;s</h3>
            <p>{story.paragraphs.length} tekstblokken op de verhalenpagina.</p>
          </div>
          <button
            className="ta-btn ta-btn-primary"
            type="button"
            onClick={() => patchStory({ paragraphs: [...story.paragraphs, ""] })}
          >
            + Alinea
          </button>
        </header>

        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek in alinea's..." label="Zoeken" />

        <div className="ta-story-paragraphs">
          {filteredIndexes.length ? (
            filteredIndexes.map(({ index }) => (
              <div className="ta-story-paragraph" key={`story-p-${index}`}>
                <div className="ta-story-paragraph-head">
                  <strong>Alinea {index + 1}</strong>
                  <button
                    className="ta-btn ta-btn-ghost ta-btn-icon"
                    type="button"
                    aria-label="Alinea verwijderen"
                    onClick={() => patchStory({ paragraphs: story.paragraphs.filter((_, i) => i !== index) })}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={story.paragraphs[index]}
                  onChange={(event) => {
                    const paragraphs = [...story.paragraphs];
                    paragraphs[index] = event.target.value;
                    patchStory({ paragraphs });
                  }}
                />
              </div>
            ))
          ) : (
            <div className="ta-empty">Geen alinea&apos;s gevonden.</div>
          )}
        </div>
      </article>
    </div>
  );
}

export function HomePanel({ content, onChange }: { content: SiteContent; onChange: (c: SiteContent) => void }) {
  const [view, setView] = useState<HomeView>("hero");

  const options = useMemo(
    () => [
      { value: "hero", label: "Hero & navigatie" },
      { value: "hours", label: "Openingstijden" },
      { value: "story", label: "Our Story" }
    ],
    []
  );

  return (
    <div className="ta-home-panel">
      <AdminFilterChips value={view} onChange={(value) => setView(value as HomeView)} options={options} />
      {view === "hero" ? <HeroSection content={content} onChange={onChange} /> : null}
      {view === "hours" ? <OpeningHoursSection content={content} onChange={onChange} /> : null}
      {view === "story" ? <StorySection content={content} onChange={onChange} /> : null}
    </div>
  );
}
