import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import type { NavItemId, SiteContent } from "@tresamigos/types";
import { getVisibleNavItems, NAV_ITEM_I18N_KEYS, NAV_ITEM_PATHS, DEFAULT_NAV_SETTINGS } from "@tresamigos/utils/navDefaults";
import { assetUrl } from "../lib/api";
import { showCateringNav } from "../lib/featureFlags";
import { useCateringCart } from "../context/CateringCartContext";
import { usePageMotion } from "../hooks/usePageMotion";
import { unlockDocumentScroll, useScrollToTop } from "../hooks/useScrollToTop";
import { useLanguage } from "../i18n/LanguageProvider";
import { AnalyticsTracker } from "./AnalyticsTracker";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { IconCart, IconLocation, IconLogin } from "./NavIcons";
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

function MainNavLink({ id, label }: { id: NavItemId; label: string }) {
  const path = NAV_ITEM_PATHS[id];
  return (
    <NavLink to={path} end={path === "/"}>
      {label}
    </NavLink>
  );
}

function UtilityNavLink({ id, label }: { id: NavItemId; label: string }) {
  const path = NAV_ITEM_PATHS[id];
  if (id === "findTresAmigos") {
    return (
      <Link className="nav-text-link" to={path}>
        <IconLocation />
        <span>{label}</span>
      </Link>
    );
  }
  if (id === "login") {
    return (
      <Link className="nav-text-link" to={path}>
        <IconLogin />
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <Link className="nav-text-link" to={path}>
      <span>{label}</span>
    </Link>
  );
}

function CartNavLink({ mobile }: { mobile?: boolean }) {
  const { t } = useLanguage();
  const location = useLocation();
  const { itemCount, openDrawer, cartPulse } = useCateringCart();
  const className = mobile ? "nav-icon-link nav-cart-link nav-mobile-only" : "nav-icon-link nav-cart-link";
  const isCatering = location.pathname === "/catering";
  const pulseClass = isCatering && cartPulse ? " is-pulse" : "";

  if (isCatering) {
    return (
      <button
        className={`${className}${pulseClass}`}
        type="button"
        aria-label={itemCount > 0 ? `${t("nav.cart")} (${itemCount})` : t("nav.cart")}
        onClick={openDrawer}
      >
        <IconCart />
        {itemCount > 0 ? <span className="nav-cart-badge">{itemCount}</span> : null}
      </button>
    );
  }

  return (
    <Link
      className={className}
      to={itemCount > 0 ? "/catering?view=cart" : "/catering"}
      aria-label={itemCount > 0 ? `${t("nav.cart")} (${itemCount})` : t("nav.cart")}
    >
      <IconCart />
      {itemCount > 0 ? <span className="nav-cart-badge">{itemCount}</span> : null}
    </Link>
  );
}

function MobileUtilityNavLink({ id, label }: { id: NavItemId; label: string }) {
  const path = NAV_ITEM_PATHS[id];
  if (id === "findTresAmigos") {
    return (
      <Link className="nav-text-link nav-mobile-only" to={path}>
        <IconLocation />
        <span>{label}</span>
      </Link>
    );
  }
  if (id === "login") {
    return (
      <Link className="nav-text-link nav-mobile-only" to={path}>
        <IconLogin />
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <Link className="nav-text-link nav-mobile-only" to={path}>
      <span>{label}</span>
    </Link>
  );
}

function resolveMainNavItems(navigation: SiteContent["site"]["navigation"]) {
  const settings = navigation ?? DEFAULT_NAV_SETTINGS;
  let items = getVisibleNavItems(settings, "main");

  if (!showCateringNav) {
    return items.filter((item) => item.id !== "catering");
  }

  if (!items.some((item) => item.id === "catering")) {
    const cateringDefault = DEFAULT_NAV_SETTINGS.items.find((item) => item.id === "catering");
    if (cateringDefault) {
      items = [...items, cateringDefault].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }

  return items;
}

function UtilityNavItems({
  navigation,
  mobile
}: {
  navigation: SiteContent["site"]["navigation"];
  mobile?: boolean;
}) {
  const { t } = useLanguage();
  const utilityNavItems = getVisibleNavItems(navigation, "utility");
  const loginIndex = utilityNavItems.findIndex((item) => item.id === "login");

  return (
    <>
      {utilityNavItems.map((item, index) => (
        <span key={item.id} style={{ display: "contents" }}>
          {index === loginIndex ? <CartNavLink mobile={mobile} /> : null}
          {mobile ? (
            <MobileUtilityNavLink id={item.id} label={t(NAV_ITEM_I18N_KEYS[item.id])} />
          ) : (
            <UtilityNavLink id={item.id} label={t(NAV_ITEM_I18N_KEYS[item.id])} />
          )}
        </span>
      ))}
      {loginIndex === -1 ? <CartNavLink mobile={mobile} /> : null}
    </>
  );
}

export function Layout({ content }: LayoutProps) {
  const { site, locations } = content;
  const location = useLocation();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const lockedScrollY = useRef(0);
  const restoreScrollOnClose = useRef(true);
  const mainNavItems = resolveMainNavItems(site.navigation);
  useScrollToTop();
  usePageMotion();

  useEffect(() => {
    // Navigating away: unlock without restoring the old scroll (useScrollToTop handles top).
    restoreScrollOnClose.current = false;
    setMenuOpen(false);
    unlockDocumentScroll();
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.classList.remove("nav-open");
      document.body.style.removeProperty("top");
      document.body.style.removeProperty("padding-right");
      return;
    }

    restoreScrollOnClose.current = true;
    lockedScrollY.current = window.scrollY;
    const scrollY = lockedScrollY.current;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    document.body.classList.add("nav-open");
    document.body.style.top = `-${scrollY}px`;
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("nav-open");
      document.body.style.removeProperty("top");
      document.body.style.removeProperty("padding-right");
      // Only restore when the user closed the menu on the same page.
      if (restoreScrollOnClose.current) {
        window.scrollTo(0, lockedScrollY.current);
      }
    };
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
              <div className="nav-mobile-only nav-mobile-lang nav-mobile-lang-top">
                <LanguageSwitcher />
              </div>
              {mainNavItems.map((item) => (
                <MainNavLink key={item.id} id={item.id} label={t(NAV_ITEM_I18N_KEYS[item.id])} />
              ))}
              <UtilityNavItems navigation={site.navigation} mobile />
            </div>
          </div>

          <div className={`nav-right nav-desktop-only${menuOpen ? " open" : ""}`}>
            <UtilityNavItems navigation={site.navigation} />
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
      {menuOpen ? <div className="nav-lock-spacer" aria-hidden="true" /> : null}
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
