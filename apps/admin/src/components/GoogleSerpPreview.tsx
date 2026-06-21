import type { SeoPageKey } from "@tresamigos/types";

const SEO_PAGE_PATHS: Record<SeoPageKey, string> = {
  home: "/",
  menu: "/menu",
  locations: "/locations",
  order: "/order",
  contact: "/contact",
  ourStory: "/our-story",
  ourValue: "/our-value",
  vacancy: "/vacancy"
};

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

interface Props {
  pageKey: SeoPageKey;
  title: string;
  description: string;
  siteName?: string;
  siteUrl?: string;
}

export function GoogleSerpPreview({
  pageKey,
  title,
  description,
  siteName = "Tres Amigos",
  siteUrl = "https://tresamigos.nl"
}: Props) {
  const path = SEO_PAGE_PATHS[pageKey];
  const displayUrl = `${siteUrl.replace(/\/$/, "")}${path === "/" ? "" : path}`;

  return (
    <section className="ta-serp-preview" aria-label="Google zoekresultaat preview">
      <p className="ta-serp-preview-label">Google preview</p>
      <div className="ta-serp-card">
        <div className="ta-serp-site">
          <span className="ta-serp-favicon" aria-hidden="true" />
          <div>
            <strong>{siteName}</strong>
            <small>{displayUrl}</small>
          </div>
        </div>
        <h4 className="ta-serp-title">{truncate(title || "Paginatitel", 60)}</h4>
        <p className="ta-serp-description">{truncate(description || "Meta description verschijnt hier.", 160)}</p>
      </div>
      <div className="ta-serp-meta">
        <span>Titel: {(title || "").length}/60</span>
        <span>Description: {(description || "").length}/160</span>
      </div>
    </section>
  );
}
