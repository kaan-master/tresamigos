import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { LocationCard, OrderCard } from "../components/LocationCards";
import { useLanguage } from "../i18n/LanguageProvider";
import { pageSeo } from "../lib/seo";

export function OrderPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const locations = content.locations.filter((location) => location.active !== false);
  const seo = pageSeo(content, "order");

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact">
        <div className="shell">
          <h1>{t("order.title")}</h1>
          <p>{t("order.intro")}</p>
        </div>
      </header>
      <main className="section">
        <div className="shell order-grid">
          {locations.map((location) => (
            <OrderCard location={location} key={location.id} />
          ))}
        </div>
      </main>
    </>
  );
}

export function LocationsPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const locations = content.locations.filter((location) => location.active !== false);
  const seo = pageSeo(content, "locations");

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact">
        <div className="shell">
          <h1>{t("locations.title")}</h1>
          <p>{t("locations.intro")}</p>
        </div>
      </header>
      <main className="section">
        <div className="shell locations four">
          {locations.map((location) => (
            <LocationCard location={location} key={location.id} />
          ))}
        </div>
      </main>
    </>
  );
}
