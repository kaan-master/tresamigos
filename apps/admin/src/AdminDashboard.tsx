import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Application, CateringOrder, FranchiseInquiry, SiteContent } from "@tresamigos/types";
import { api } from "./lib/api";
import { readAdminRoute, writeAdminRoute, type AdminRouteTab } from "./lib/adminRoute";
import { IconLogout, IconMenu, tabIcons } from "./components/AdminIcons";
import { AdminLoaderScreen } from "./components/AdminLoadingPopup";
import { OverviewPanel } from "./components/OverviewPanel";
import { LocationsPanel } from "./components/LocationsPanel";
import { MediaLibraryPanel } from "./components/MediaLibraryPanel";
import { ProductsPanel } from "./components/ProductsPanel";
import { ApplicationsPanel, type ApplicationsView } from "./components/ApplicationsPanel";
import { FranchisePanel, type FranchiseView } from "./components/FranchisePanel";
import { NewsletterPanel } from "./components/NewsletterPanel";
import { CateringPanel } from "./components/CateringPanel";
import type { CateringView } from "./components/catering/cateringNav";
import { INCOMING_STATUSES } from "./lib/cateringAdmin";
import { buildAdminSearchItems, type AdminSearchItem } from "./lib/adminTabletSearch";
import { ReviewsPanel } from "./components/ReviewsPanel";
import { SeoPanel } from "./components/SeoPanel";
import { TellingenPanel } from "./components/TellingenPanel";
import { allowedSiteSettingsViews, SiteSettingsPanel, type SiteSettingsView } from "./components/SiteSettingsPanel";
import { AdminStartDock } from "./components/tablet/AdminStartDock";
import { AdminTabletBar } from "./components/tablet/AdminTabletBar";
import { AdminTabletHub } from "./components/tablet/AdminTabletHub";
import { AdminTabletToggle } from "./components/tablet/AdminTabletToggle";
import { useAdminFeedback } from "./context/AdminFeedbackContext";
import { QuietSaveCapture, QuietSaveProvider } from "./context/QuietSaveContext";
import { useAdminTablet } from "./context/AdminTabletContext";
import type { AdminSessionUser, AdminTabId } from "@tresamigos/types";

const tabs = [
  ["overview", "Overzicht"],
  ["locations", "Vestigingen"],
  ["products", "Producten"],
  ["media", "Media"],
  ["applications", "Sollicitaties"],
  ["franchise", "Franchise"],
  ["newsletter", "Nieuwsbrief"],
  ["catering", "Catering"],
  ["reviews", "Reviews"],
  ["seo", "SEO"],
  ["siteSettings", "Website-instellingen"],
  ["tellingen", "Tellingen"]
] as const;

type TabId = (typeof tabs)[number][0];

const NAV_SECTIONS: Array<{ label: string; ids: TabId[] }> = [
  { label: "Overzicht", ids: ["overview"] },
  { label: "Inhoud", ids: ["locations", "products", "media", "seo", "siteSettings"] },
  { label: "Aanvragen", ids: ["applications", "franchise", "newsletter", "catering", "reviews"] },
  { label: "Beheer", ids: ["tellingen"] }
];

interface Props {
  user: AdminSessionUser | null;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: Props) {
  const { enabled: tabletMode, screen: tabletScreen, openPanel } = useAdminTablet();
  const { notifyLoading, notifyError, clear: clearFeedback, runSave } = useAdminFeedback();
  const initialRoute = useMemo(() => readAdminRoute(), []);
  const [activeTab, setActiveTab] = useState<TabId>(initialRoute.tab);
  const [navOpen, setNavOpen] = useState(false);
  const [cateringNavigateView, setCateringNavigateView] = useState<CateringView | null>(
    initialRoute.tab === "catering" ? (initialRoute.view as CateringView | null) : null
  );
  const [cateringOpenOrderId, setCateringOpenOrderId] = useState<string | null>(null);
  const [applicationsNavigateView, setApplicationsNavigateView] = useState<ApplicationsView | null>(
    initialRoute.tab === "applications" ? (initialRoute.view as ApplicationsView | null) : null
  );
  const [siteSettingsNavigateView, setSiteSettingsNavigateView] = useState<SiteSettingsView | null>(
    initialRoute.tab === "siteSettings" ? (initialRoute.view as SiteSettingsView | null) : null
  );
  const [franchiseNavigateView, setFranchiseNavigateView] = useState<FranchiseView | null>(
    initialRoute.tab === "franchise" ? (initialRoute.view as FranchiseView | null) : null
  );
  const [tellingenNavigateView, setTellingenNavigateView] = useState<string | null>(
    initialRoute.tab === "tellingen" ? initialRoute.view : null
  );
  const [integrationsSubView, setIntegrationsSubView] = useState<string | null>(
    initialRoute.tab === "siteSettings" && initialRoute.view === "integrations" ? initialRoute.sub : null
  );
  const [content, setContent] = useState<SiteContent | null>(null);
  const contentRef = useRef<SiteContent | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [franchiseInquiries, setFranchiseInquiries] = useState<FranchiseInquiry[]>([]);
  const [cateringOrders, setCateringOrders] = useState<CateringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function updateContent(next: SiteContent) {
    contentRef.current = next;
    setContent(next);
  }

  async function loadCateringOrders() {
    try {
      const cateringData = await api<{ orders: CateringOrder[] }>("/api/admin/catering-orders");
      setCateringOrders(cateringData.orders);
    } catch {
      setCateringOrders([]);
    }
  }

  async function refreshContent() {
    const contentData = await api<SiteContent>("/api/admin/content");
    contentRef.current = contentData;
    setContent(contentData);
    return contentData;
  }

  async function loadAll() {
    setLoading(true);
    notifyLoading("Dashboard laden", "Content en inkomende berichten ophalen...");
    try {
      const [contentData, applicationsData, franchiseData] = await Promise.all([
        api<SiteContent>("/api/admin/content"),
        api<{ applications: Application[] }>("/api/admin/applications").catch(() => ({ applications: [] })),
        api<{ inquiries: FranchiseInquiry[] }>("/api/admin/franchise").catch(() => ({ inquiries: [] }))
      ]);
      contentRef.current = contentData;
      setContent(contentData);
      setApplications(applicationsData.applications);
      setFranchiseInquiries(franchiseData.inquiries);
      await loadCateringOrders();
      clearFeedback();
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Probeer opnieuw.", "Laden mislukt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    if (initialRoute.tab !== "overview") openPanel();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => void loadCateringOrders(), 45_000);
    return () => window.clearInterval(interval);
  }, []);

  const siteSettingViews = useMemo(() => allowedSiteSettingsViews(user), [user]);

  const visibleTabs = useMemo(() => {
    if (!user || user.role === "master") return tabs;
    return tabs.filter(([id]) => {
      if (id === "siteSettings") return siteSettingViews.length > 0;
      if (id === "franchise") {
        return user.permissions.includes("franchise") || user.permissions.includes("franchiseShop");
      }
      return user.permissions.includes(id as AdminTabId);
    });
  }, [user, siteSettingViews]);

  useEffect(() => {
    if (!visibleTabs.some(([id]) => id === activeTab)) {
      setActiveTab(visibleTabs[0]?.[0] || "overview");
    }
  }, [visibleTabs, activeTab]);

  const incomingCateringCount = useMemo(
    () => cateringOrders.filter((order) => INCOMING_STATUSES.has(order.status)).length,
    [cateringOrders]
  );

  const newCateringOrderCount = useMemo(
    () => cateringOrders.filter((order) => order.status === "nieuw").length,
    [cateringOrders]
  );

  const kpis = useMemo(() => {
    if (!content) return [];
    return [
      ["Actieve vestigingen", content.locations.filter((location) => location.active !== false).length],
      ["Bestelknoppen", content.locations.reduce((total, location) => total + location.links.length, 0)],
      ["Producten", content.menu.reduce((total, category) => total + category.items.length, 0)],
      ["Video's", content.videos.filter((video) => video.active !== false).length],
      ["Sollicitaties", applications.length],
      ["Franchise", franchiseInquiries.length],
      ["Catering inkomend", incomingCateringCount],
      ["Hero tags", content.site.hero.tags.length]
    ] as const;
  }, [content, applications.length, franchiseInquiries.length, incomingCateringCount]);

  async function saveContent() {
    const payload = contentRef.current || content;
    if (!payload || saving) return;
    const routeBefore = readAdminRoute();
    setSaving(true);
    try {
      await runSave(
        async () => {
          await api<SiteContent>("/api/admin/content", {
            method: "PUT",
            body: JSON.stringify(payload)
          });
        },
        {
          refresh: async () => {
            await refreshContent();
            // Altijd terug op dezelfde pagina — geen navigatie-reset na opslaan.
            writeAdminRoute(routeBefore);
          },
          successMessage: "Alle wijzigingen zijn opgeslagen en vernieuwd."
        }
      );
    } catch {
      /* feedback toont de fout */
    } finally {
      setSaving(false);
    }
  }

  async function saveContentQuiet(next?: SiteContent): Promise<SiteContent | null> {
    const payload = next || contentRef.current || content;
    if (!payload || saving) return null;
    setSaving(true);
    try {
      const saved = await api<SiteContent>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      contentRef.current = saved;
      setContent(saved);
      return saved;
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Opslaan mislukt.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  const tabletHubItems = useMemo(
    () =>
      visibleTabs.map(([id, label]) => ({
        id,
        label,
        Icon: tabIcons[id],
        badge: id === "catering" && newCateringOrderCount > 0 ? newCateringOrderCount : undefined
      })),
    [visibleTabs, newCateringOrderCount]
  );

  const searchItems = useMemo(
    () => buildAdminSearchItems(visibleTabs, { siteSettingViews, hasApplications: visibleTabs.some(([id]) => id === "applications") }),
    [visibleTabs, siteSettingViews]
  );

  const recentOrders = useMemo(
    () => [...cateringOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [cateringOrders]
  );

  if (loading || !content) {
    return <AdminLoaderScreen />;
  }

  const activeLabel = tabs.find(([id]) => id === activeTab)?.[1] || "Dashboard";

  function selectTab(id: TabId) {
    setActiveTab(id);
    setNavOpen(false);
    openPanel();
    if (id !== "catering") {
      setCateringNavigateView(null);
      setCateringOpenOrderId(null);
    }
    if (id !== "applications") setApplicationsNavigateView(null);
    if (id !== "siteSettings") {
      setSiteSettingsNavigateView(null);
      setIntegrationsSubView(null);
    }
    if (id !== "franchise") setFranchiseNavigateView(null);
    if (id !== "tellingen") setTellingenNavigateView(null);
    writeAdminRoute({ tab: id as AdminRouteTab, view: null, sub: null });
  }

  function syncNestedView(tab: TabId, view: string | null, sub: string | null = null) {
    writeAdminRoute({ tab: tab as AdminRouteTab, view, sub });
  }

  function handleSearchSelect(item: AdminSearchItem) {
    if (item.target.kind === "tab") {
      selectTab(item.target.tabId as TabId);
      return;
    }
    if (item.target.kind === "applications") {
      setActiveTab("applications");
      setApplicationsNavigateView(item.target.view);
      setNavOpen(false);
      openPanel();
      writeAdminRoute({ tab: "applications", view: item.target.view, sub: null });
      return;
    }
    if (item.target.kind === "franchise") {
      setActiveTab("franchise");
      setFranchiseNavigateView(item.target.view);
      setNavOpen(false);
      openPanel();
      writeAdminRoute({ tab: "franchise", view: item.target.view, sub: null });
      return;
    }
    if (item.target.kind === "siteSettings") {
      setActiveTab("siteSettings");
      setSiteSettingsNavigateView(item.target.view);
      setIntegrationsSubView(null);
      setNavOpen(false);
      openPanel();
      writeAdminRoute({ tab: "siteSettings", view: item.target.view, sub: null });
      return;
    }
    setActiveTab("catering");
    setCateringNavigateView(item.target.view);
    setCateringOpenOrderId(null);
    openPanel();
    writeAdminRoute({ tab: "catering", view: item.target.view, sub: null });
  }

  function handleOpenOrders() {
    setActiveTab("catering");
    setCateringNavigateView("orders");
    setCateringOpenOrderId(null);
    writeAdminRoute({ tab: "catering", view: "orders", sub: null });
  }

  function handleOpenOrder(orderId: string) {
    setActiveTab("catering");
    setCateringNavigateView("orders");
    setCateringOpenOrderId(orderId);
    writeAdminRoute({ tab: "catering", view: "orders", sub: null });
  }

  const panels = (
    <>
      {activeTab === "overview" ? (
        <section className="ta-panel ta-fade-in">
          <OverviewPanel />
          <div className="ta-kpis" style={{ marginTop: 18 }}>
            {kpis.map(([label, value]) => (
              <article
                className={`ta-kpi${label === "Catering inkomend" ? " ta-kpi-clickable" : ""}`}
                key={label}
                {...(label === "Catering inkomend"
                  ? {
                      role: "button",
                      tabIndex: 0,
                      onClick: () => selectTab("catering"),
                      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                        if (event.key === "Enter" || event.key === " ") selectTab("catering");
                      }
                    }
                  : {})}
              >
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "locations" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>Vestigingen</h2>
            <p>Kies links een locatie. Rechts pas je gegevens en bestelknoppen aan, zonder geneste lijsten.</p>
          </header>
          <LocationsPanel content={content} onChange={updateContent} onSaveQuiet={saveContentQuiet} saving={saving} />
        </section>
      ) : null}

      {activeTab === "products" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>Producten</h2>
            <p>Kies een categorie, bewerk producten en afbeeldingen.</p>
          </header>
          <ProductsPanel content={content} onChange={updateContent} onSave={saveContent} onSaveQuiet={saveContentQuiet} saving={saving} />
        </section>
      ) : null}

      {activeTab === "media" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>Media plaza</h2>
            <p>Upload afbeeldingen en video&apos;s, beheer homepage-video&apos;s en sectieteksten.</p>
          </header>
          <MediaLibraryPanel content={content} onChange={updateContent} onSave={saveContent} onSaveQuiet={saveContentQuiet} saving={saving} />
        </section>
      ) : null}

      {activeTab === "applications" ? (
        <section className="ta-panel ta-fade-in ta-panel-entra">
          <ApplicationsPanel
            content={content}
            applications={applications}
            onChange={updateContent}
            onSave={saveContent}
            onSaveQuiet={saveContentQuiet}
            saving={saving}
            initialView={applicationsNavigateView}
            onViewChange={(view) => {
              setApplicationsNavigateView(view);
              syncNestedView("applications", view);
            }}
          />
        </section>
      ) : null}

      {activeTab === "franchise" ? (
        <section className="ta-panel ta-panel-entra ta-fade-in">
          <FranchisePanel
            inquiries={franchiseInquiries}
            content={content}
            initialView={franchiseNavigateView}
            onViewChange={(view) => {
              setFranchiseNavigateView(view);
              syncNestedView("franchise", view);
            }}
          />
        </section>
      ) : null}

      {activeTab === "newsletter" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>Nieuwsbrief</h2>
            <p>Abonnees bekijken, zoeken en exporteren als CSV (Mailchimp-stijl).</p>
          </header>
          <NewsletterPanel />
        </section>
      ) : null}

      {activeTab === "catering" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>Catering</h2>
            <p>
              Beheer bestellingen, producten en werkwijze vanuit één overzicht.
              {newCateringOrderCount > 0
                ? ` ${newCateringOrderCount} nieuwe bestelling${newCateringOrderCount === 1 ? "" : "en"} wacht${newCateringOrderCount === 1 ? "" : "en"} op actie.`
                : incomingCateringCount > 0
                  ? ` ${incomingCateringCount} order(s) in behandeling.`
                  : ""}
            </p>
          </header>
          <CateringPanel
            content={content}
            onContentChange={updateContent}
            orders={cateringOrders}
            onOrdersChange={setCateringOrders}
            isActive={activeTab === "catering"}
            newOrderCount={newCateringOrderCount}
            onSave={saveContent}
            onSaveQuiet={saveContentQuiet}
            saving={saving}
            navigateToView={cateringNavigateView}
            openOrderId={cateringOpenOrderId}
            onViewChange={(view) => {
              setCateringNavigateView(view);
              syncNestedView("catering", view);
            }}
          />
        </section>
      ) : null}

      {activeTab === "reviews" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>Reviews & Instagram</h2>
            <p>Modereer ingezonden reviews, beheer vaste reviews en stel de Instagram-slider in.</p>
          </header>
          <ReviewsPanel content={content} onChange={updateContent} onSave={saveContent} onSaveQuiet={saveContentQuiet} saving={saving} />
        </section>
      ) : null}

      {activeTab === "seo" ? (
        <section className="ta-panel ta-fade-in">
          <header className="ta-panel-head">
            <h2>SEO & Search Console</h2>
            <p>Site-brede instellingen, verificatiecodes en SEO per pagina.</p>
          </header>
          <SeoPanel content={content} onChange={updateContent} onSave={saveContent} onSaveQuiet={saveContentQuiet} saving={saving} />
        </section>
      ) : null}

      {activeTab === "tellingen" ? (
        <section className="ta-panel ta-fade-in ta-panel-entra">
          <TellingenPanel
            locations={content.locations}
            initialView={tellingenNavigateView}
            onViewChange={(view) => {
              setTellingenNavigateView(view);
              syncNestedView("tellingen", view);
            }}
          />
        </section>
      ) : null}

      {activeTab === "siteSettings" ? (
        <section className="ta-panel ta-fade-in ta-panel-entra">
          <SiteSettingsPanel
            content={content}
            onChange={updateContent}
            onSave={saveContent}
            onSaveQuiet={saveContentQuiet}
            saving={saving}
            allowedViews={siteSettingViews}
            initialView={siteSettingsNavigateView}
            integrationsSubView={integrationsSubView}
            onViewChange={(view, sub = null) => {
              setSiteSettingsNavigateView(view);
              setIntegrationsSubView(view === "integrations" ? sub : null);
              syncNestedView("siteSettings", view, view === "integrations" ? sub : null);
            }}
          />
        </section>
      ) : null}
    </>
  );

  const quietPanels = content ? (
    <QuietSaveProvider content={content} onChange={updateContent} onSaveQuiet={saveContentQuiet} saving={saving}>
      <QuietSaveCapture>{panels}</QuietSaveCapture>
    </QuietSaveProvider>
  ) : (
    panels
  );

  return (
    <>
      <div className={`ta-shell${tabletMode ? " is-tablet-mode" : ""}`}>
        {!tabletMode ? (
          <>
            {navOpen ? <button type="button" className="ta-nav-dim" aria-label="Menu sluiten" onClick={() => setNavOpen(false)} /> : null}
            <aside className={`ta-sidebar${navOpen ? " is-open" : ""}`}>
            <div className="ta-brand">
              <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos logo" />
              <div>
                <strong>Tres Amigos</strong>
                <span>Admin</span>
              </div>
            </div>

            <nav className="ta-nav">
              {NAV_SECTIONS.map((section) => {
                const sectionTabs = visibleTabs.filter(([id]) => section.ids.includes(id));
                if (!sectionTabs.length) return null;
                return (
                  <div className="ta-nav-group" key={section.label}>
                    <p className="ta-nav-group-label">{section.label}</p>
                    {sectionTabs.map(([id, label]) => {
                      const Icon = tabIcons[id];
                      const badge = id === "catering" && newCateringOrderCount > 0 ? newCateringOrderCount : null;
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`${activeTab === id ? "is-active" : ""}${id === "catering" && newCateringOrderCount > 0 ? " has-notification" : ""}`}
                          onClick={() => selectTab(id)}
                        >
                          <Icon width={18} height={18} />
                          <span>{label}</span>
                          {badge ? <span className="ta-nav-badge">{badge}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
            {user ? (
              <div className="ta-sidebar-user">
                <div className="ta-sidebar-user-meta">
                  <strong>{user.name}</strong>
                  <span>{user.role === "master" ? "Beheerder" : user.email}</span>
                </div>
                <button type="button" className="ta-sidebar-logout" onClick={onLogout}>
                  <IconLogout width={16} height={16} />
                  <span>Uitloggen</span>
                </button>
              </div>
            ) : null}
          </aside>
          </>
        ) : null}

        <main className="ta-main">
          {tabletMode ? (
            tabletScreen === "hub" ? (
              <>
                <AdminTabletBar
                  title="Dashboard"
                  searchItems={searchItems}
                  onSearchSelect={handleSearchSelect}
                />
                <AdminTabletHub items={tabletHubItems} activeId={activeTab} onSelect={(id) => selectTab(id as TabId)} />
              </>
            ) : (
              <>
                <AdminTabletBar
                  title={activeLabel}
                  showBack
                  searchItems={searchItems}
                  onSearchSelect={handleSearchSelect}
                />
                {quietPanels}
              </>
            )
          ) : (
            <>
              <header className="ta-main-head ta-fade-in">
                <div className="ta-main-head-title">
                  <button type="button" className="ta-nav-toggle" aria-label="Menu" onClick={() => setNavOpen(true)}>
                    <IconMenu width={20} height={20} />
                  </button>
                  <div>
                    <nav className="ta-main-breadcrumbs" aria-label="Broodkruimels">
                      <span>Admin</span>
                      <span className="ta-crumb-sep" aria-hidden="true">
                        /
                      </span>
                      <strong>{activeLabel}</strong>
                    </nav>
                    <h1>{activeLabel}</h1>
                  </div>
                </div>
                <AdminTabletToggle />
              </header>
              {quietPanels}
            </>
          )}
        </main>
      </div>

      {tabletMode ? (
        <AdminStartDock
          hubItems={tabletHubItems}
          activeId={activeTab}
          onSelectTab={(id) => selectTab(id as TabId)}
          searchItems={searchItems}
          onSearchSelect={handleSearchSelect}
          user={user}
          onLogout={onLogout}
          recentOrders={recentOrders}
          onOpenOrders={handleOpenOrders}
          onOpenOrder={handleOpenOrder}
        />
      ) : null}
    </>
  );
}
