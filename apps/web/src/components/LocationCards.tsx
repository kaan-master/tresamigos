import type { SiteContent } from "@tresamigos/types";
import { assetUrl } from "../lib/api";

const PLATFORM_LOGOS: Record<string, string> = {
  "take away": "/assets/uploads/takeaway.png",
  thuisbezorgd: "/assets/uploads/thuisbezorgd.png",
  "uber eats": "/assets/uploads/ubereats.png",
  delivery: "/assets/uploads/takeaway.png"
};

function logoForLabel(label: string) {
  return PLATFORM_LOGOS[label.trim().toLowerCase()] || null;
}

export function OrderPlatformLinks({
  links
}: {
  links: SiteContent["locations"][number]["links"];
}) {
  return (
    <div className="platform-links">
      {links.map((link) => {
        const logo = logoForLabel(link.label);
        return (
          <a
            className="platform-link"
            href={link.url}
            key={`${link.label}-${link.url}`}
            target={link.url.startsWith("http") ? "_blank" : undefined}
            rel={link.url.startsWith("http") ? "noreferrer" : undefined}
            aria-label={`${link.label} bestellen`}
            title={link.label}
          >
            {logo ? (
              <img src={assetUrl(logo)} alt={link.label} loading="lazy" />
            ) : (
              <span>{link.label}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export function LocationCard({
  location
}: {
  location: SiteContent["locations"][number];
}) {
  return (
    <article className="location-card">
      <h3>{location.area}</h3>
      <div className="meta">
        <span>{location.address}</span>
        {location.note ? <span className="location-note">{location.note}</span> : null}
      </div>
      <OrderPlatformLinks links={location.links} />
    </article>
  );
}

export function OrderCard({
  location
}: {
  location: SiteContent["locations"][number];
}) {
  return (
    <article className="order-card">
      <h3>{location.area}</h3>
      <p>{location.address}</p>
      {location.note ? <p className="location-note">{location.note}</p> : null}
      <OrderPlatformLinks links={location.links} />
    </article>
  );
}
