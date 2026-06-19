import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { SiteContent } from "@tresamigos/types";
import { assetUrl, pageUrl } from "../lib/api";
import { usePageMotion } from "../hooks/usePageMotion";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { PromoPopup } from "./PromoPopup";

interface LayoutProps {
  content: SiteContent;
}

export function Layout({ content }: LayoutProps) {
  const { site, locations } = content;
  const location = useLocation();
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
            Menu
          </button>
          <div className="nav-links">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/menu">Menu</NavLink>
            <NavLink to="/locations">Locations</NavLink>
            <NavLink to="/our-story">Our Story</NavLink>
            <NavLink to="/vacancy">Work With Us</NavLink>
            <NavLink to="/contact">Contact</NavLink>
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
            <h3>Opening hours</h3>
            <p className="footer-hours-summary">{site.openingHours.summary}</p>
            {site.openingHours.groups.map((group) => (
              <p key={`${group.label}-${group.hours}`}>
                <strong>{group.label}:</strong> {group.hours}
              </p>
            ))}
          </div>
          <div>
            <h3>Locations</h3>
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
            <h3>Contact</h3>
            <p>
              <a href={`mailto:${site.footer.email}`}>{site.footer.email}</a>
            </p>
            <p>
              <Link to="/order">All order links</Link>
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
        <div className="shell copyright">{site.footer.copyright}</div>
      </footer>
    </>
  );
}
