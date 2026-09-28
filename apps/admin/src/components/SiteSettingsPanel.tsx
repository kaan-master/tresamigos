import { useEffect, useMemo, useState } from "react";
import type { AdminSessionUser, SiteContent } from "@tresamigos/types";
import {
  IconFooter,
  IconHome,
  IconIntegrations,
  IconNavigation,
  IconPageMedia,
  IconUsers
} from "./AdminIcons";
import { FooterPanel } from "./FooterPanel";
import { HomePanel } from "./HomePanel";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { NavbarPanel } from "./NavbarPanel";
import { PageMediaPanel } from "./PageMediaPanel";
import { UsersPanel } from "./UsersPanel";
import type { PanelSaveProps } from "./FormSaveBar";
import { EntraShell, type EntraNavItem } from "./telling/entraUi";

export type SiteSettingsView = "home" | "pageMedia" | "navigation" | "footer" | "integrations" | "users";

export const SITE_SETTINGS_VIEWS: readonly SiteSettingsView[] = [
  "home",
  "pageMedia",
  "navigation",
  "footer",
  "integrations",
  "users"
];

const NAV: Array<EntraNavItem<SiteSettingsView>> = [
  { id: "home", label: "Home-tekst", hint: "Hero, uren en paginatekst", Icon: IconHome, section: "Inhoud" },
  { id: "pageMedia", label: "Pagina-foto's", hint: "Alle pagina-afbeeldingen", Icon: IconPageMedia, section: "Inhoud" },
  { id: "navigation", label: "Menu", hint: "Wat bezoekers in de navbar zien", Icon: IconNavigation, section: "Vormgeving" },
  { id: "footer", label: "Footer", hint: "Onderaan de site, promo en contact", Icon: IconFooter, section: "Vormgeving" },
  { id: "integrations", label: "Koppelingen", hint: "Google Ads, nieuwsbrief, mail", Icon: IconIntegrations, section: "Beheer" },
  { id: "users", label: "Gebruikers", hint: "Accounts en rechten", Icon: IconUsers, section: "Beheer" }
];

const TITLES: Record<SiteSettingsView, { title: string; subtitle: string }> = {
  home: { title: "Home-tekst", subtitle: "Teksten voor home, openingstijden, ons verhaal en onze waarden. Foto's staan bij Pagina-foto's." },
  pageMedia: { title: "Pagina-foto's", subtitle: "De enige plek voor pagina-afbeeldingen en het focuspunt." },
  navigation: { title: "Menu", subtitle: "Welke links in de navbar staan en in welke volgorde" },
  footer: { title: "Footer", subtitle: "Onderaan de site, promo-mail en contactformulier" },
  integrations: { title: "Koppelingen", subtitle: "Google Ads, nieuwsbrief en mailrelay" },
  users: { title: "Gebruikers", subtitle: "Subaccounts met rechten per onderdeel" }
};

export function allowedSiteSettingsViews(user: AdminSessionUser | null): SiteSettingsView[] {
  if (!user || user.role === "master") return [...SITE_SETTINGS_VIEWS];
  return SITE_SETTINGS_VIEWS.filter((id) => user.permissions.includes(id));
}

interface Props extends PanelSaveProps {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
  allowedViews: SiteSettingsView[];
  initialView?: SiteSettingsView | null;
}

export function SiteSettingsPanel({ content, onChange, onSave, onSaveQuiet, saving, allowedViews, initialView }: Props) {
  const items = useMemo(() => NAV.filter((item) => allowedViews.includes(item.id)), [allowedViews]);
  const [view, setView] = useState<SiteSettingsView>(
    initialView && allowedViews.includes(initialView) ? initialView : allowedViews[0] || "home"
  );

  useEffect(() => {
    if (initialView && allowedViews.includes(initialView)) {
      setView(initialView);
      return;
    }
    setView((current) => (allowedViews.includes(current) ? current : allowedViews[0] || "home"));
  }, [initialView, allowedViews]);

  const copy = TITLES[view];
  const saveProps = { onSave, onSaveQuiet, saving };

  if (!items.length) {
    return <p className="entra-empty">Geen website-instellingen beschikbaar voor dit account.</p>;
  }

  return (
    <EntraShell brand="Website-instellingen" items={items} view={view} onChange={setView} title={copy.title} subtitle={copy.subtitle}>
      <div className="entra-embed">
        {view === "home" ? <HomePanel content={content} onChange={onChange} {...saveProps} /> : null}
        {view === "pageMedia" ? <PageMediaPanel content={content} onChange={onChange} {...saveProps} /> : null}
        {view === "navigation" ? <NavbarPanel content={content} onChange={onChange} {...saveProps} /> : null}
        {view === "footer" ? <FooterPanel content={content} onChange={onChange} {...saveProps} /> : null}
        {view === "integrations" ? <IntegrationsPanel /> : null}
        {view === "users" ? <UsersPanel /> : null}
      </div>
    </EntraShell>
  );
}
