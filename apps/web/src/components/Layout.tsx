import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { SiteContent } from "@tresamigos/types";
import { assetUrl } from "../lib/api";
import { usePageMotion } from "../hooks/usePageMotion";
import { useLanguage } from "../i18n/LanguageProvider";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { IconLocation, IconLogin } from "./NavIcons";
import { SocialLinks } from "./SocialLinks";
import { SiteHead } from "./Helmet";

interface LayoutProps {
  content: SiteContent;
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg className={`hamburger-icon${open ? " is-open" : ""}`} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path className="hamburger-line hamburger-line-top" d="M4 7h16" />
      <path className="hamburger-line hamburger-line-mid" d="M4 12h16" />
      <path className="hamburger-line hamburger-line-bot" d="M4 17h16" />
    </svg>
  );
}

function formatCopyright(template: string) {
  const year = new Date().getFullYear();
  if (/\d{4}/.test(template)) return template.replace(/\d{4}/, String(year));
  return `© ${year} ${template.replace(/^©\s*/, "").trim()}`;
}

export function Layout({ content }: LayoutProps) {
  const { site, locations } = content;
  const location = useLocation();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  usePageMotion();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  return (
    <>
      <SiteHead
        googleSiteVerification={site.seo.googleSiteVerification}
        bingSiteVerification={site.seo.bingSiteVerification}
      />
      <AnalyticsTracker />
      <nav className={`nav nav-split${menuOpen ? " is-open" : ""}`}>
        <div className="shell shell-wide nav-inner">
          <div className="nav-left">
            <Link className="brand" to="/" aria-label="Tres Amigos home">
              <span className="brand-mark">
                <img src={assetUrl("/assets/site/tres-amigos-logo-new.png")} alt="Tres Amigos" />
              </span>
            </Link>
            <div className={`nav-links nav-links-main${menuOpen ? " open" : ""}`} id="site-nav-links">
              <NavLink to="/menu">{t("nav.menu")}</NavLink>
              <NavLink to="/locations">{t("nav.locations")}</NavLink>
              <NavLink to="/our-story">{t("nav.ourStory")}</NavLink>
              <NavLink to="/our-value">{t("nav.ourValue")}</NavLink>
              <NavLink to="/vacancy">{t("nav.vacancy")}</NavLink>
              <NavLink to="/contact">{t("nav.contact")}</NavLink>
              <Link className="nav-text-link nav-mobile-only" to="/locations">
                <IconLocation />
                <span>{t("nav.findTresAmigos")}</span>
              </Link>
              <Link className="nav-text-link nav-mobile-only" to="/login">
                <IconLogin />
                <span>{t("nav.login")}</span>
              </Link>
              <div className="nav-mobile-only nav-mobile-lang">
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          <div className={`nav-right nav-desktop-only${menuOpen ? " open" : ""}`}>
            <Link className="nav-text-link" to="/locations">
              <IconLocation />
              <span>{t("nav.findTresAmigos")}</span>
            </Link>
            <Link className="nav-text-link" to="/login">
              <IconLogin />
              <span>{t("nav.login")}</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <button
            className={`mobile-toggle${menuOpen ? " is-open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-nav-links"
            aria-label={menuOpen ? t("common.closeMenu") : t("common.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <HamburgerIcon open={menuOpen} />
            <span className="mobile-toggle-label">{menuOpen ? t("common.close") : t("common.menu")}</span>
          </button>
        </div>
        {menuOpen ? <button className="nav-backdrop" type="button" aria-label={t("common.closeMenu")} onClick={() => setMenuOpen(false)} /> : null}
      </nav>
      <div className="page-enter" key={location.pathname}>
        <Outlet />
      </div>
      <footer className="footer">
        <div className="shell footer-grid">
          <div>
            <Link className="footer-brand" to="/">
              Tres Amigos
            </Link>
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
            </p>
            <SocialLinks instagramUrl={site.footer.instagramUrl} tiktokUrl={site.footer.tiktokUrl} />
          </div>
        </div>
        <div className="shell copyright">{formatCopyright(site.footer.copyright)}</div>
      </footer>
    </>
  );
}
