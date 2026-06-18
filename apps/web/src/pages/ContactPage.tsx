import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";

export function ContactPage({ content }: { content: SiteContent }) {
  const locations = content.locations.filter((location) => location.active !== false);

  return (
    <>
      <Helmet title="Contact | Tres Amigos" description="Neem contact op met Tres Amigos Amsterdam." />
      <header className="page-head compact">
        <div className="shell">
          <div className="eyebrow">Contact</div>
          <h1>Get in touch</h1>
          <p>Questions about locations, catering or the brand? Reach out and we will get back to you.</p>
        </div>
      </header>
      <main className="section">
        <div className="shell split">
          <div>
            <h2 className="section-title">Email</h2>
            <p className="lead">
              <a href={`mailto:${content.site.footer.email}`}>{content.site.footer.email}</a>
            </p>
            <div className="notice">
              <strong>Contactformulier</strong>
              <p>Het contactformulier wordt in een volgende sprint gekoppeld aan e-mail of CRM.</p>
            </div>
          </div>
          <div className="order-grid">
            {locations.map((location) => (
              <article className="order-card" key={location.id}>
                <span className="tag">{location.area}</span>
                <h3>{location.name}</h3>
                <p>{location.address}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
