import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { SiteContent } from "@tresamigos/types";
import { assetUrl, pageUrl } from "../lib/api";
import { usePageMotion } from "../hooks/usePageMotion";
import { useLanguage } from "../i18n/LanguageProvider";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LiveVisitorsStats } from "./LiveVisitorsStats";
import { PromoPopup } from "./PromoPopup";

interface LayoutProps {
  content: SiteContent;
}

export function Layout({ content }: LayoutProps) {
  const { site, locations } = content;
  const location = useLocation();
  const { t } = useLanguage();
  usePageMotion();

  return (
    <>
      <AnalyticsTracker />
      <PromoPopup settings={site.promoPopup} />
      <nav className="nav">
        <div className="shell nav-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <img src={assetUrl("/assets/site/tres-amigos-logo-new.png")} alt="Tres Amigos logo" />
            </span>
            <span>
              Tres
              <br />
              Amigos
            </span>
          </Link>
          <button className="mobile-toggle" type="button" data-menu-toggle>
            {t("common.menu")}
          </button>
          <div className="nav-links">
            <NavLink to="/" end>
              {t("nav.home")}
            </NavLink>
            <NavLink to="/menu">{t("nav.menu")}</NavLink>
            <NavLink to="/locations">{t("nav.locations")}</NavLink>
            <NavLink to="/our-story">{t("nav.ourStory")}</NavLink>
            <NavLink to="/vacancy">{t("nav.vacancy")}</NavLink>
            <NavLink to="/contact">{t("nav.contact")}</NavLink>
            <LanguageSwitcher />
            <Link className="nav-cta" to={pageUrl(site.navCta.url)}>
              {site.navCta.label}
            </Link>
          </div>
        </div>
      </nav>
      <div className="page-enter" key={location.pathname}>
        <Outlet />
      </div>
      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <h2>{site.footer.title}</h2>
            <p className="lead">{site.footer.intro}</p>
          </div>
          <div>
            <h3>{t("footer.openingHours")}</h3>
            <p className="footer-hours-summary">{site.openingHours.summary}</p>
            {site.openingHours.groups.map((group) => (
              <p key={`${group.label}-${group.hours}`}>
                <strong>{group.label}:</strong> {group.hours}
              </p>
            ))}
          </div>
          <div>
            <h3>{t("footer.locations")}</h3>
            {locations
              .filter((location) => location.active !== false)
              .map((location) => {
                const parts = location.address.split(",").map((part) => part.trim()).filter(Boolean);
                return (
                  <p key={location.id}>
                    {parts[0]}
                    {parts.length > 1 ? (
                      <>
                        <br />
                        {parts.slice(1).join(", ")}
                      </>
                    ) : null}
                  </p>
                );
              })}
          </div>
          <div>
            <h3>{t("footer.contact")}</h3>
            <p>
              <a href={`mailto:${site.footer.email}`}>{site.footer.email}</a>
            </p>
            <p>
              <Link to="/order">{t("footer.allOrderLinks")}</Link>
              <br />
              {site.footer.instagramUrl ? (
                <a href={site.footer.instagramUrl} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              ) : null}
              <br />
              {site.footer.tiktokUrl ? (
                <a href={site.footer.tiktokUrl} target="_blank" rel="noreferrer">
                  TikTok
                </a>
              ) : null}
            </p>
          </div>
        </div>
        <LiveVisitorsStats />
        <div className="shell copyright">{site.footer.copyright}</div>
      </footer>
    </>
  );
}
