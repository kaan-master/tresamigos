import type { SiteContent } from "@tresamigos/types";
import { SEO_PAGE_KEYS } from "@tresamigos/types";

interface Props {
  content: SiteContent;
}

function checklist(content: SiteContent) {
  const siteUrl = content.site.seo.siteUrl?.trim();
  const google = content.site.seo.googleSiteVerification?.trim();
  const bing = content.site.seo.bingSiteVerification?.trim();
  const ogImage = content.site.seo.image?.trim();
  const pages = SEO_PAGE_KEYS.map((key) => content.site.seo.pages[key]);

  return [
    { label: "Site-URL ingesteld", ok: Boolean(siteUrl) },
    { label: "Standaard Open Graph-afbeelding", ok: Boolean(ogImage) },
    { label: "Google Search Console verificatie", ok: Boolean(google) },
    { label: "Bing Webmaster verificatie", ok: Boolean(bing) },
    { label: "Alle pagina's hebben een titel", ok: pages.every((page) => page.title.trim().length > 0) },
    { label: "Alle pagina's hebben een description", ok: pages.every((page) => page.description.trim().length > 20) },
    {
      label: "Titels onder ~60 tekens",
      ok: pages.every((page) => page.title.length <= 60)
    },
    {
      label: "Descriptions rond 140–160 tekens",
      ok: pages.every((page) => page.description.length >= 120 && page.description.length <= 170)
    }
  ];
}

export function SeoChecklist({ content }: Props) {
  const items = checklist(content);
  const score = items.filter((item) => item.ok).length;

  return (
    <section className="ta-seo-checklist">
      <header className="ta-panel-head">
        <h3>SEO & Search Console checklist</h3>
        <p>
          {score}/{items.length} aanbevelingen afgerond. Sitemap:{" "}
          <a href="/sitemap.xml" target="_blank" rel="noreferrer">
            /sitemap.xml
          </a>{" "}
          · Robots:{" "}
          <a href="/robots.txt" target="_blank" rel="noreferrer">
            /robots.txt
          </a>
        </p>
      </header>
      <ul className="ta-seo-checklist-list">
        {items.map((item) => (
          <li className={item.ok ? "is-ok" : "is-missing"} key={item.label}>
            <span aria-hidden="true">{item.ok ? "✓" : "○"}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
