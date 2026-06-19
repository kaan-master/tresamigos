import { useMemo, useState } from "react";
import { SEO_PAGE_KEYS, SEO_PAGE_LABELS, type PageSeo, type SeoPageKey, type SiteContent } from "@tresamigos/types";
import { AdminListRow, AdminSearchBar } from "./AdminListUi";

interface Props {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

export function SeoPanel({ content, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<SeoPageKey>("home");
  const page = content.site.seo.pages[selectedKey];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SEO_PAGE_KEYS.filter((key) => {
      if (!normalized) return true;
      const item = content.site.seo.pages[key];
      return `${SEO_PAGE_LABELS[key]} ${item.title} ${item.description}`.toLowerCase().includes(normalized);
    });
  }, [content.site.seo.pages, query]);

  function updatePage(next: PageSeo) {
    onChange({
      ...content,
      site: {
        ...content.site,
        seo: {
          ...content.site.seo,
          pages: {
            ...content.site.seo.pages,
            [selectedKey]: next
          }
        }
      }
    });
  }

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek pagina of SEO titel..." />
        <div className="ta-list-scroll">
          {filtered.map((key) => (
            <AdminListRow
              key={key}
              title={SEO_PAGE_LABELS[key]}
              meta={content.site.seo.pages[key].title}
              active={key === selectedKey}
              onClick={() => setSelectedKey(key)}
            />
          ))}
        </div>
      </div>

      <div className="ta-detail-pane ta-fade-in" key={selectedKey}>
        <h3 className="ta-section-title">{SEO_PAGE_LABELS[selectedKey]}</h3>
        <div className="ta-grid">
          <label className="ta-field ta-grid-wide">
            <span>Paginatitel</span>
            <input value={page.title} onChange={(event) => updatePage({ ...page, title: event.target.value })} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Meta description</span>
            <textarea value={page.description} onChange={(event) => updatePage({ ...page, description: event.target.value })} rows={4} />
          </label>
        </div>
        <p className="ta-seo-hint">
          Tip: houd titels onder ~60 tekens en descriptions rond 140–160 tekens voor Google-previews.
        </p>
      </div>
    </div>
  );
}
