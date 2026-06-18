import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";

function orderButtons(links: SiteContent["locations"][number]["links"]) {
  return (
    <div className="actions">
      {links.map((link) => (
        <a
          className="btn alt"
          href={link.url}
          key={`${link.label}-${link.url}`}
          target={link.url.startsWith("http") ? "_blank" : undefined}
          rel={link.url.startsWith("http") ? "noreferrer" : undefined}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function OrderPage({ content }: { content: SiteContent }) {
  const locations = content.locations.filter((location) => location.active !== false);

  return (
    <>
      <Helmet title="Order | Tres Amigos" description="Bestel bij Tres Amigos Amsterdam per vestiging." />
      <header className="page-head compact">
        <div className="shell">
          <div className="eyebrow">Order</div>
          <h1>Choose your location</h1>
          <p>Every shop has its own correct order links. Pick the closest Tres Amigos and order through Take Away, Delivery, Thuisbezorgd or Uber Eats.</p>
        </div>
      </header>
      <main className="section">
        <div className="shell order-grid">
          {locations.map((location) => (
            <article className="order-card in-view" key={location.id}>
              <span className="tag">{location.area}</span>
              <h3>{location.name}</h3>
              <p>{location.address}</p>
              <p>{location.note}</p>
              {orderButtons(location.links)}
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export function LocationsPage({ content }: { content: SiteContent }) {
  const locations = content.locations.filter((location) => location.active !== false);

  return (
    <>
      <Helmet title="Locations | Tres Amigos" description="Alle Tres Amigos vestigingen in Amsterdam." />
      <header className="page-head compact">
        <div className="shell">
          <div className="eyebrow">Locations</div>
          <h1>Four Amsterdam shops</h1>
          <p>Find your nearest Tres Amigos and use the correct order links per location.</p>
        </div>
      </header>
      <main className="section">
        <div className="shell locations four">
          {locations.map((location) => (
            <article className="location-card in-view" key={location.id}>
              <span className="tag">{location.area}</span>
              <h3>{location.name}</h3>
              <div className="meta">
                <span>{location.address}</span>
                <span>{location.note}</span>
              </div>
              {orderButtons(location.links)}
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
