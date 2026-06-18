import { Link, NavLink, Outlet } from "react-router-dom";
import type { SiteContent } from "@tresamigos/types";
import { assetUrl, pageUrl } from "../lib/api";

interface LayoutProps {
  content: SiteContent;
}

export function Layout({ content }: LayoutProps) {
  const { site, locations } = content;

  return (
    <>
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
      <Outlet />
      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <h2>{site.footer.title}</h2>
            <p className="lead">{site.footer.intro}</p>
          </div>
          <div>
            <h3>Locations</h3>
            {locations
              .filter((location) => location.active !== false)
              .map((location) => (
                <p key={location.id}>
                  {location.address.split(",")[0]}
                  <br />
                  {location.address.split(",").slice(1).join(",").trim() || location.area}
                </p>
              ))}
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
