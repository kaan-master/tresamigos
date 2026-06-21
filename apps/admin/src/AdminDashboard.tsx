import { useEffect, useMemo, useState } from "react";
import type { Application, SiteContent } from "@tresamigos/types";
import { api } from "./lib/api";
import { randomSaveError, randomSaveLoading, randomSaveSuccess } from "./lib/saveMessages";
import { AdminBadge } from "./components/AdminBadge";
import { AdminButton } from "./components/AdminButton";
import { IconLogout, IconSave, tabIcons } from "./components/AdminIcons";
import { AdminLoaderScreen, AdminLoadingPopup } from "./components/AdminLoadingPopup";
import { OverviewPanel } from "./components/OverviewPanel";
import { LocationsPanel } from "./components/LocationsPanel";
import { MediaLibraryPanel } from "./components/MediaLibraryPanel";
import { ProductsPanel } from "./components/ProductsPanel";
import { ApplicationsPanel } from "./components/ApplicationsPanel";
import { FooterPanel } from "./components/FooterPanel";
import { HomePanel } from "./components/HomePanel";
import { SeoPanel } from "./components/SeoPanel";
import { ReviewsPanel } from "./components/ReviewsPanel";
import { UsersPanel } from "./components/UsersPanel";
import type { AdminSessionUser, AdminTabId } from "@tresamigos/types";

const tabs = [
  ["overview", "Overzicht"],
  ["home", "Home"],
  ["locations", "Vestigingen"],
  ["products", "Producten"],
  ["media", "Media"],
  ["applications", "Sollicitaties"],
  ["reviews", "Reviews"],
  ["seo", "SEO"],
  ["footer", "Footer"],
  ["users", "Gebruikers"]
] as const;

type TabId = (typeof tabs)[number][0];

interface Props {
  user: AdminSessionUser | null;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [popup, setPopup] = useState<{ title: string; message?: string; tone: "loading" | "success" | "error" } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    setPopup({ title: "Dashboard laden", message: "Content en sollicitaties ophalen...", tone: "loading" });
    try {
      const [contentData, applicationsData] = await Promise.all([
        api<SiteContent>("/api/admin/content"),
        api<{ applications: Application[] }>("/api/admin/applications").catch(() => ({ applications: [] }))
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

  const visibleTabs = useMemo(() => {
    if (!user || user.role === "master") return tabs;
    return tabs.filter(([id]) => user.permissions.includes(id as AdminTabId));
  }, [user]);

  useEffect(() => {
    if (!visibleTabs.some(([id]) => id === activeTab)) {
      setActiveTab(visibleTabs[0]?.[0] || "overview");
    }
  }, [visibleTabs, activeTab]);

  const canSaveContent = useMemo(() => {
    if (!user || user.role === "master") return true;
    return ["home", "locations", "products", "media", "seo", "footer"].some((tab) =>
      user.permissions.includes(tab as AdminTabId)
    );
  }, [user]);

  const kpis = useMemo(() => {
    if (!content) return [];
    return [
      ["Actieve vestigingen", content.locations.filter((location) => location.active !== false).length],
      ["Bestelknoppen", content.locations.reduce((total, location) => total + location.links.length, 0)],
      ["Producten", content.menu.reduce((total, category) => total + category.items.length, 0)],
      ["Video's", content.videos.filter((video) => video.active !== false).length],
      ["Sollicitaties", applications.length],
      ["Hero tags", content.site.hero.tags.length]
    ] as const;
  }, [content, applications.length]);

  async function saveContent() {
    if (!content || saving) return;
    const loadingMsg = randomSaveLoading();
    setSaving(true);
    setPopup({ title: loadingMsg.title, message: loadingMsg.message, tone: "loading" });
    try {
      const saved = await api<SiteContent>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
      setContent(saved);
      const successMsg = randomSaveSuccess();
      setPopup({ title: successMsg.title, message: successMsg.message, tone: "success" });
      window.setTimeout(() => setPopup(null), 3200);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Probeer opnieuw.";
      const errorMsg = randomSaveError(fallback);
      setPopup({ title: errorMsg.title, message: errorMsg.message, tone: "error" });
    } finally {
      setSaving(false);
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
            {visibleTabs.map(([id, label]) => {
              const Icon = tabIcons[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={activeTab === id ? "is-active" : ""}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon width={18} height={18} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
          {user ? (
            <div className="ta-sidebar-user">
              <strong>{user.name}</strong>
              <span>{user.role === "master" ? "Beheerder" : user.email}</span>
            </div>
          ) : null}
        </aside>

        <main className="ta-main">
          <header className="ta-main-head ta-fade-in">
            <div>
              <AdminBadge />
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
              <header className="ta-panel-head">
                <h2>Home</h2>
                <p>Hero, openingstijden en Our Story — per onderdeel bewerken met live preview waar het kan.</p>
              </header>
              <HomePanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "locations" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Vestigingen</h2>
                <p>Kies links een locatie. Rechts pas je gegevens en bestelknoppen aan — zonder geneste lijsten.</p>
              </header>
              <LocationsPanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "products" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Producten</h2>
                <p>Kies een categorie, bewerk producten en afbeeldingen.</p>
              </header>
              <ProductsPanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "media" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Media plaza</h2>
                <p>Upload afbeeldingen en video&apos;s, beheer homepage-video&apos;s en sectieteksten.</p>
              </header>
              <MediaLibraryPanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "applications" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Sollicitaties</h2>
                <p>Inkomende sollicitaties bekijken, functies beheren en vacaturepagina instellen.</p>
              </header>
              <ApplicationsPanel content={content} applications={applications} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "reviews" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Reviews & Instagram</h2>
                <p>Modereer ingezonden reviews, beheer vaste reviews en stel de Instagram-slider in.</p>
              </header>
              <ReviewsPanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "seo" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>SEO & Search Console</h2>
                <p>Site-brede instellingen, verificatiecodes en SEO per pagina.</p>
              </header>
              <SeoPanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}

          {activeTab === "users" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Medewerkers</h2>
                <p>Subaccounts voor medewerkers met rechten per onderdeel.</p>
              </header>
              <UsersPanel />
            </section>
          ) : null}

          {activeTab === "footer" ? (
            <section className="ta-panel ta-fade-in">
              <header className="ta-panel-head">
                <h2>Footer & extras</h2>
                <p>Footer, promo-mail en contactformulier — per onderdeel bewerken.</p>
              </header>
              <FooterPanel content={content} onChange={setContent} onSave={saveContent} saving={saving} />
            </section>
          ) : null}
        </main>
      </div>

      <div className="ta-action-dock">
        {canSaveContent ? (
          <AdminButton
            variant="primary"
            icon={<IconSave width={16} height={16} />}
            loading={saving}
            loadingText="Opslaan..."
            onClick={() => void saveContent()}
          >
            Opslaan
          </AdminButton>
        ) : null}
        <AdminButton variant="ghost" icon={<IconLogout width={16} height={16} />} onClick={onLogout}>
          Uitloggen
        </AdminButton>
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
