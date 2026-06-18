import { useEffect, useMemo, useState } from "react";
import type { Application, SiteContent } from "@tresamigos/types";
import { api } from "./lib/api";

const tabs = [
  ["overview", "Overzicht"],
  ["home", "Home"],
  ["locations", "Vestigingen"],
  ["videos", "Video's"],
  ["menu", "Menu"],
  ["applications", "Aanvragen"],
  ["seo", "SEO"],
  ["footer", "Footer"]
] as const;

type TabId = (typeof tabs)[number][0];

interface Props {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [contentData, applicationsData] = await Promise.all([
        api<SiteContent>("/api/admin/content"),
        api<{ applications: Application[] }>("/api/admin/applications")
      ]);
      setContent(contentData);
      setApplications(applicationsData.applications);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const kpis = useMemo(() => {
    if (!content) return [];
    const activeLocations = content.locations.filter((location) => location.active !== false).length;
    const orderLinks = content.locations.reduce((total, location) => total + location.links.length, 0);
    const activeVideos = content.videos.filter((video) => video.active !== false).length;
    const menuItems = content.menu.reduce((total, category) => total + category.items.length, 0);
    return [
      ["Actieve vestigingen", activeLocations],
      ["Bestelknoppen", orderLinks],
      ["Video's", activeVideos],
      ["Menu-items", menuItems],
      ["Aanvragen", applications.length],
      ["Hero tags", content.site.hero.tags.length]
    ] as const;
  }, [content, applications.length]);

  async function saveContent() {
    if (!content) return;
    setSaving(true);
    setMessage("");
    try {
      const saved = await api<SiteContent>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
      setContent(saved);
      setMessage("Content opgeslagen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !content) {
    return <div className="admin-shell"><div className="admin-content">Dashboard laden...</div></div>;
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand admin-brand" href="/admin/">
          <span className="brand-mark">
            <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos logo" />
          </span>
        </a>
        <div className="admin-sidebar-intro">
          <p className="mini-label">Tres CMS</p>
          <h1>Dashboard</h1>
          <p>React admin · PostgreSQL · Redis · NestJS API</p>
        </div>
        <nav className="admin-tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={activeTab === id ? "active" : ""} type="button" onClick={() => setActiveTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-actions">
          <button className="btn primary" type="button" onClick={() => void saveContent()} disabled={saving}>
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <button className="btn alt" type="button" onClick={onLogout}>
            Uitloggen
          </button>
        </div>
      </aside>

      <section className="admin-content">
        <div className="admin-editor">
          <div className="admin-topbar">
            <div>
              <p className="mini-label">Tres Amigos</p>
              <h2>{tabs.find(([id]) => id === activeTab)?.[1]}</h2>
            </div>
          </div>

          {activeTab === "overview" ? (
            <section className="admin-panel active">
              <div className="admin-kpi-grid">
                {kpis.map(([label, value]) => (
                  <article className="admin-kpi" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </article>
                ))}
              </div>
              <article className="admin-card">
                <h3>Platform stack</h3>
                <p className="admin-muted">React web + React admin · NestJS API · Prisma · PostgreSQL · Redis</p>
                <div className="admin-architecture">
                  <span>Website</span><span>API</span><span>PostgreSQL</span><span>Redis</span><span>Admin</span>
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "home" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-grid">
                  <label>Hero eyebrow<input value={content.site.hero.eyebrow} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, eyebrow: event.target.value } } })} /></label>
                  <label>Hero title<input value={content.site.hero.title} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, title: event.target.value } } })} /></label>
                  <label className="wide">Hero intro<input value={content.site.hero.intro} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, intro: event.target.value } } })} /></label>
                  <label>Primary label<input value={content.site.hero.primaryLabel} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, primaryLabel: event.target.value } } })} /></label>
                  <label>Primary URL<input value={content.site.hero.primaryUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, primaryUrl: event.target.value } } })} /></label>
                  <label>Secondary label<input value={content.site.hero.secondaryLabel} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, secondaryLabel: event.target.value } } })} /></label>
                  <label>Secondary URL<input value={content.site.hero.secondaryUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, secondaryUrl: event.target.value } } })} /></label>
                  <label>Nav CTA label<input value={content.site.navCta.label} onChange={(event) => setContent({ ...content, site: { ...content.site, navCta: { ...content.site.navCta, label: event.target.value } } })} /></label>
                  <label>Nav CTA URL<input value={content.site.navCta.url} onChange={(event) => setContent({ ...content, site: { ...content.site, navCta: { ...content.site.navCta, url: event.target.value } } })} /></label>
                  <label className="wide">Hero tags (comma separated)<input value={content.site.hero.tags.join(", ")} onChange={(event) => setContent({ ...content, site: { ...content.site, hero: { ...content.site.hero, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) } } })} /></label>
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "locations" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-locations">
                  {content.locations.map((location, index) => (
                    <article className="admin-location-card admin-accordion-item open" key={location.id}>
                      <div className="admin-accordion-head">
                        <span className="admin-accordion-leading" aria-hidden="true">
                          <img src="/assets/site/tres-amigos-logo-new.png" alt="" />
                        </span>
                        <span className="admin-accordion-copy">
                          <strong>{location.name}</strong>
                          <small>{location.area} · {location.address}</small>
                        </span>
                        <em>{location.active !== false ? "Actief" : "Verborgen"}</em>
                      </div>
                      <div className="admin-accordion-body">
                        <div className="admin-grid">
                          <label>Naam<input value={location.name} onChange={(event) => { const locations = [...content.locations]; locations[index] = { ...location, name: event.target.value }; setContent({ ...content, locations }); }} /></label>
                          <label>Regio<input value={location.area} onChange={(event) => { const locations = [...content.locations]; locations[index] = { ...location, area: event.target.value }; setContent({ ...content, locations }); }} /></label>
                          <label className="wide">Adres<input value={location.address} onChange={(event) => { const locations = [...content.locations]; locations[index] = { ...location, address: event.target.value }; setContent({ ...content, locations }); }} /></label>
                          <label className="wide">Notitie<input value={location.note} onChange={(event) => { const locations = [...content.locations]; locations[index] = { ...location, note: event.target.value }; setContent({ ...content, locations }); }} /></label>
                        </div>
                        <div className="admin-link-list">
                          {location.links.map((link, linkIndex) => (
                            <div className="admin-link-row quiet" key={`${location.id}-${linkIndex}`}>
                              <label>Knop tekst<input value={link.label} onChange={(event) => { const locations = [...content.locations]; const links = [...location.links]; links[linkIndex] = { ...link, label: event.target.value }; locations[index] = { ...location, links }; setContent({ ...content, locations }); }} /></label>
                              <label>URL<input value={link.url} onChange={(event) => { const locations = [...content.locations]; const links = [...location.links]; links[linkIndex] = { ...link, url: event.target.value }; locations[index] = { ...location, links }; setContent({ ...content, locations }); }} /></label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "videos" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-grid">
                  <label>Videos eyebrow<input value={content.site.videosSection.eyebrow} onChange={(event) => setContent({ ...content, site: { ...content.site, videosSection: { ...content.site.videosSection, eyebrow: event.target.value } } })} /></label>
                  <label>Videos title<input value={content.site.videosSection.title} onChange={(event) => setContent({ ...content, site: { ...content.site, videosSection: { ...content.site.videosSection, title: event.target.value } } })} /></label>
                  <label className="wide">Videos intro<input value={content.site.videosSection.intro} onChange={(event) => setContent({ ...content, site: { ...content.site, videosSection: { ...content.site.videosSection, intro: event.target.value } } })} /></label>
                </div>
                <div className="admin-videos">
                  {content.videos.map((video, index) => (
                    <article className="admin-video-card admin-accordion-item open" key={video.id}>
                      <div className="admin-accordion-body admin-video-body">
                        <video src={video.src.startsWith("/") ? video.src : `/${video.src}`} muted playsInline preload="metadata" />
                        <div className="admin-video-form">
                          <div className="admin-grid">
                            <label>Titel<input value={video.title} onChange={(event) => { const videos = [...content.videos]; videos[index] = { ...video, title: event.target.value }; setContent({ ...content, videos }); }} /></label>
                            <label className="wide">Video URL<input value={video.src} onChange={(event) => { const videos = [...content.videos]; videos[index] = { ...video, src: event.target.value }; setContent({ ...content, videos }); }} /></label>
                            <label className="wide">Caption<input value={video.caption} onChange={(event) => { const videos = [...content.videos]; videos[index] = { ...video, caption: event.target.value }; setContent({ ...content, videos }); }} /></label>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "menu" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-menu">
                  {content.menu.map((category, categoryIndex) => (
                    <article className="admin-menu-category admin-accordion-item open" key={category.id}>
                      <div className="admin-accordion-head">
                        <span className="admin-accordion-copy"><strong>{category.title}</strong></span>
                      </div>
                      <div className="admin-accordion-body">
                        <div className="admin-menu-items">
                          {category.items.map((item, itemIndex) => (
                            <div className="admin-menu-item" key={item.id}>
                              <div className="admin-grid">
                                <label className="wide">Naam<input value={item.name} onChange={(event) => { const menu = [...content.menu]; const items = [...category.items]; items[itemIndex] = { ...item, name: event.target.value }; menu[categoryIndex] = { ...category, items }; setContent({ ...content, menu }); }} /></label>
                                <label>Prijs<input value={item.price} onChange={(event) => { const menu = [...content.menu]; const items = [...category.items]; items[itemIndex] = { ...item, price: event.target.value }; menu[categoryIndex] = { ...category, items }; setContent({ ...content, menu }); }} /></label>
                                <label className="wide">Omschrijving<textarea value={item.description} onChange={(event) => { const menu = [...content.menu]; const items = [...category.items]; items[itemIndex] = { ...item, description: event.target.value }; menu[categoryIndex] = { ...category, items }; setContent({ ...content, menu }); }} /></label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "applications" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-applications">
                  {applications.length ? applications.map((application) => (
                    <article className="admin-accordion-item admin-application-card open" key={application.id}>
                      <div className="admin-accordion-head">
                        <span className="admin-accordion-copy">
                          <strong>{application.name}</strong>
                          <small>{application.role} · {new Date(application.createdAt).toLocaleString("nl-NL")}</small>
                        </span>
                        <em>{application.status}</em>
                      </div>
                      <div className="admin-accordion-body">
                        <div className="admin-intake-summary">
                          <div><span>E-mail</span><strong>{application.email}</strong></div>
                          <div><span>Telefoon</span><strong>{application.phone || "-"}</strong></div>
                          <div><span>Dagen</span><strong>{application.days.join(", ") || "-"}</strong></div>
                          <div><span>PDF</span><strong>{application.pdf?.name || "Geen PDF"}</strong></div>
                        </div>
                        <p>{application.motivation}</p>
                        {application.pdf?.data ? (
                          <a className="btn alt" href={application.pdf.data} download={application.pdf.name}>PDF downloaden</a>
                        ) : null}
                      </div>
                    </article>
                  )) : <p className="admin-empty">Nog geen sollicitatie-aanvragen gevonden.</p>}
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "seo" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-grid">
                  <label>Site title<input value={content.site.seo.title} onChange={(event) => setContent({ ...content, site: { ...content.site, seo: { ...content.site.seo, title: event.target.value } } })} /></label>
                  <label className="wide">Site description<input value={content.site.seo.description} onChange={(event) => setContent({ ...content, site: { ...content.site, seo: { ...content.site.seo, description: event.target.value } } })} /></label>
                  <label>Menu title<input value={content.site.seo.menuTitle} onChange={(event) => setContent({ ...content, site: { ...content.site, seo: { ...content.site.seo, menuTitle: event.target.value } } })} /></label>
                  <label className="wide">Menu description<input value={content.site.seo.menuDescription} onChange={(event) => setContent({ ...content, site: { ...content.site, seo: { ...content.site.seo, menuDescription: event.target.value } } })} /></label>
                  <label className="wide">SEO image URL<input value={content.site.seo.image} onChange={(event) => setContent({ ...content, site: { ...content.site, seo: { ...content.site.seo, image: event.target.value } } })} /></label>
                </div>
              </article>
            </section>
          ) : null}

          {activeTab === "footer" ? (
            <section className="admin-panel active">
              <article className="admin-card">
                <div className="admin-grid">
                  <label>Footer title<input value={content.site.footer.title} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, title: event.target.value } } })} /></label>
                  <label className="wide">Footer intro<input value={content.site.footer.intro} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, intro: event.target.value } } })} /></label>
                  <label>E-mail<input value={content.site.footer.email} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, email: event.target.value } } })} /></label>
                  <label>Instagram URL<input value={content.site.footer.instagramUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, instagramUrl: event.target.value } } })} /></label>
                  <label>TikTok URL<input value={content.site.footer.tiktokUrl} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, tiktokUrl: event.target.value } } })} /></label>
                  <label>Copyright<input value={content.site.footer.copyright} onChange={(event) => setContent({ ...content, site: { ...content.site, footer: { ...content.site.footer, copyright: event.target.value } } })} /></label>
                </div>
              </article>
            </section>
          ) : null}

          <p className="admin-message">{message}</p>
        </div>
      </section>
    </main>
  );
}
