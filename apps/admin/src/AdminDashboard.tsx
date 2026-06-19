import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Application, SiteContent } from "@tresamigos/types";
import { api } from "./lib/api";
import { AdminLoaderScreen, AdminLoadingPopup } from "./components/AdminLoadingPopup";
import { OverviewPanel } from "./components/OverviewPanel";
import { LocationsPanel } from "./components/LocationsPanel";
import { MediaLibraryPanel } from "./components/MediaLibraryPanel";
import { ProductsPanel } from "./components/ProductsPanel";
import { ApplicationsPanel } from "./components/ApplicationsPanel";
import { MediaField } from "./components/MediaPickerModal";
import { SeoPanel } from "./components/SeoPanel";
import { VideosPanel } from "./components/VideosPanel";
import { OpeningHoursEditor, OurStoryEditor, PromoMailEditor, ReviewsEditor, ContactFormEditor } from "./components/SiteExtrasPanel";

const tabs = [
  ["overview", "Overzicht"],
  ["home", "Home"],
  ["locations", "Vestigingen"],
  ["products", "Producten"],
  ["videos", "Video's"],
  ["media", "Media"],
  ["applications", "Aanvragen"],
  ["seo", "SEO"],
  ["footer", "Footer"]
] as const;

type TabId = (typeof tabs)[number][0];

interface Props {
  onLogout: () => void;
}

function FieldGrid({
  children,
  className = "",
  style
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`ta-grid ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function Field({
  label,
  wide,
  children
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`ta-field${wide ? " ta-grid-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function AdminDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [popup, setPopup] = useState<{ title: string; message?: string; tone: "loading" | "success" | "error" } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    setPopup({ title: "Dashboard laden", message: "Content en aanvragen ophalen...", tone: "loading" });
    try {
      const [contentData, applicationsData] = await Promise.all([
        api<SiteContent>("/api/admin/content"),
        api<{ applications: Application[] }>("/api/admin/applications")
      ]);
      setContent(contentData);
      setApplications(applicationsData.applications);
      setPopup(null);
    } catch (error) {
      setPopup({
        title: "Laden mislukt",
        message: error instanceof Error ? error.message : "Probeer opnieuw.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const kpis = useMemo(() => {
    if (!content) return [];
    return [
      ["Actieve vestigingen", content.locations.filter((location) => location.active !== false).length],
      ["Bestelknoppen", content.locations.reduce((total, location) => total + location.links.length, 0)],
      ["Producten", content.menu.reduce((total, category) => total + category.items.length, 0)],
      ["Video's", content.videos.filter((video) => video.active !== false).length],
      ["Aanvragen", applications.length],
      ["Hero tags", content.site.hero.tags.length]
    ] as const;
  }, [content, applications.length]);

  async function saveContent() {
    if (!content) return;
    setPopup({ title: "Opslaan...", message: "Wijzigingen worden veilig opgeslagen.", tone: "loading" });
    try {
      const saved = await api<SiteContent>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
      setContent(saved);
      setPopup({ title: "Opgeslagen", message: "Alle wijzigingen staan live klaar in de API.", tone: "success" });
      window.setTimeout(() => setPopup(null), 2200);
    } catch (error) {
      setPopup({
        title: "Opslaan mislukt",
        message: error instanceof Error ? error.message : "Probeer opnieuw.",
        tone: "error"
      });
    }
  }

  if (loading || !content) {
    return (
      <>
        <AdminLoaderScreen />
        <AdminLoadingPopup visible={Boolean(popup)} title={popup?.title || "Laden..."} message={popup?.message} tone={popup?.tone} />
      </>
    );
  }

  const activeLabel = tabs.find(([id]) => id === activeTab)?.[1] || "Dashboard";

  return (
    <>
      <div className="ta-shell">
        <aside className="ta-sidebar">
          <div className="ta-brand">
            <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos logo" />
            <div>
              <strong>Dashboard</strong>
              <span>Content beheer</span>
            </div>
          </div>

          <nav className="ta-nav">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={activeTab === id ? "is-active" : ""}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="ta-main">
          <header className="ta-main-head ta-fade-in">
            <div>
              <span className="ta-badge">Tres CMS</span>
              <h1>{activeLabel}</h1>
            </div>
          </header>

          {activeTab === "overview" ? (
            <section className="ta-panel ta-fade-in">
              <OverviewPanel />
              <div className="ta-kpis" style={{ marginTop: 18 }}>
                {kpis.map(([label, value]) => (
                  <article className="ta-kpi" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "home" ? (
            <section className="ta-panel ta-fade-in">
              <FieldGrid>
                <Field label="Hero eyebrow">
                  <input value={content.site.hero.eyebrow} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, eyebrow: event.target.value } } })} />
                </Field>
                <Field label="Hero title">
                  <input value={content.site.hero.title} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, title: event.target.value } } })} />
                </Field>
                <Field label="Hero intro" wide>
                  <input value={content.site.hero.intro} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, intro: event.target.value } } })} />
                </Field>
                <Field label="Primary label">
                  <input value={content.site.hero.primaryLabel} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, primaryLabel: event.target.value } } })} />
                </Field>
                <Field label="Primary URL">
                  <input value={content.site.hero.primaryUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, primaryUrl: event.target.value } } })} />
                </Field>
                <Field label="Secondary label">
                  <input value={content.site.hero.secondaryLabel} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, secondaryLabel: event.target.value } } })} />
                </Field>
                <Field label="Secondary URL">
                  <input value={content.site.hero.secondaryUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, secondaryUrl: event.target.value } } })} />
                </Field>
                <Field label="Nav CTA label">
                  <input value={content.site.navCta.label} onChange={(event) => setContent({ ...content, site: { ...content.site, navCta: { ...content.site.navCta, label: event.target.value } } })} />
                </Field>
                <Field label="Nav CTA URL">
                  <input value={content.site.navCta.url} onChange={(event) => setContent({ ...content, site: { ...content.site, navCta: { ...content.site.navCta, url: event.target.value } } })} />
                </Field>
                <Field label="Hero tags (comma separated)" wide>
                  <input
                    value={content.site.hero.tags.join(", ")}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        site: {
                          ...content.site,
                          hero: {
                            ...content.site.hero,
                            tags: event.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                          }
                        }
                      })
                    }
                  />
                </Field>
              </FieldGrid>
              <OpeningHoursEditor content={content} onChange={setContent} />
              <OurStoryEditor content={content} onChange={setContent} />
            </section>
          ) : null}

          {activeTab === "locations" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Vestigingen</h2>
                <p>Kies links een locatie. Rechts pas je gegevens en bestelknoppen aan — zonder geneste lijsten.</p>
              </header>
              <LocationsPanel content={content} onChange={setContent} />
            </section>
          ) : null}

          {activeTab === "videos" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Video&apos;s</h2>
                <p>Beheer sfeervideo&apos;s voor home en video-sectie.</p>
              </header>
              <FieldGrid style={{ marginBottom: 18 }}>
                <Field label="Videos eyebrow">
                  <input value={content.site.videosSection.eyebrow} onChange={(event) => setContent({ ...content, site: { ...content.site, videosSection: { ...content.site.videosSection, eyebrow: event.target.value } } })} />
                </Field>
                <Field label="Videos title">
                  <input value={content.site.videosSection.title} onChange={(event) => setContent({ ...content, site: { ...content.site, videosSection: { ...content.site.videosSection, title: event.target.value } } })} />
                </Field>
                <Field label="Videos intro" wide>
                  <input value={content.site.videosSection.intro} onChange={(event) => setContent({ ...content, site: { ...content.site, videosSection: { ...content.site.videosSection, intro: event.target.value } } })} />
                </Field>
              </FieldGrid>
              <VideosPanel content={content} onChange={setContent} />
            </section>
          ) : null}

          {activeTab === "products" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Producten</h2>
                <p>Categorieën links, producten rechts. Voeg categorieën en producten toe of verwijder ze.</p>
              </header>
              <ProductsPanel content={content} onChange={setContent} />
            </section>
          ) : null}

          {activeTab === "media" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Media plaza</h2>
                <p>Upload afbeeldingen en video&apos;s. Gebruik &quot;Kies media&quot; bij producten en vacatures.</p>
              </header>
              <MediaLibraryPanel content={content} />
            </section>
          ) : null}

          {activeTab === "applications" ? (
            <section className="ta-panel ta-fade-in">
              <ApplicationsPanel content={content} applications={applications} onChange={setContent} />
            </section>
          ) : null}

          {activeTab === "seo" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>SEO per pagina</h2>
                <p>Kies links een pagina en stel titel en meta description in voor Google en social previews.</p>
              </header>
              <FieldGrid style={{ marginBottom: 18 }}>
                <MediaField
                  label="Standaard SEO-afbeelding (Open Graph)"
                  value={content.site.seo.image}
                  onChange={(value) =>
                    setContent({
                      ...content,
                      site: { ...content.site, seo: { ...content.site.seo, image: value } }
                    })
                  }
                />
              </FieldGrid>
              <SeoPanel content={content} onChange={setContent} />
            </section>
          ) : null}

          {activeTab === "footer" ? (
            <section className="ta-panel ta-fade-in">
              <FieldGrid>
                <Field label="Footer title"><input value={content.site.footer.title} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, title: event.target.value } } })} /></Field>
                <Field label="E-mail"><input value={content.site.footer.email} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, email: event.target.value } } })} /></Field>
                <Field label="Footer intro" wide><input value={content.site.footer.intro} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, intro: event.target.value } } })} /></Field>
                <Field label="Instagram URL"><input value={content.site.footer.instagramUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, instagramUrl: event.target.value } } })} /></Field>
                <Field label="TikTok URL"><input value={content.site.footer.tiktokUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, tiktokUrl: event.target.value } } })} /></Field>
                <Field label="Copyright"><input value={content.site.footer.copyright} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, copyright: event.target.value } } })} /></Field>
              </FieldGrid>
              <PromoMailEditor content={content} onChange={setContent} />
              <ContactFormEditor content={content} onChange={setContent} />
              <ReviewsEditor content={content} onChange={setContent} />
            </section>
          ) : null}
        </main>
      </div>

      <div className="ta-action-dock">
        <button className="ta-btn ta-btn-primary" type="button" onClick={() => void saveContent()}>
          Opslaan
        </button>
        <button className="ta-btn ta-btn-ghost" type="button" onClick={onLogout}>
          Uitloggen
        </button>
      </div>

      <AdminLoadingPopup
        visible={Boolean(popup)}
        title={popup?.title || ""}
        message={popup?.message}
        tone={popup?.tone}
      />
    </>
  );
}
