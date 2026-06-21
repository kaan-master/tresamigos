import { useMemo, useState } from "react";
import { SEO_PAGE_KEYS, SEO_PAGE_LABELS, type PageSeo, type SeoPageKey, type SiteContent } from "@tresamigos/types";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "./AdminListUi";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { GoogleSerpPreview } from "./GoogleSerpPreview";
import { MediaField } from "./MediaPickerModal";
import { SeoChecklist } from "./SeoChecklist";

interface Props {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

type SeoPanelProps = Props & PanelSaveProps;

type SeoView = "site" | "pages";

function SeoSiteSettings({ content, onChange }: Props) {
  const seo = content.site.seo;

  return (
    <>
      <SeoChecklist content={content} />
      <div className="ta-grid" style={{ marginTop: 18 }}>
        <label className="ta-field">
          <span>Site URL</span>
          <input
            value={seo.siteUrl}
            onChange={(event) =>
              onChange({
                ...content,
                site: { ...content.site, seo: { ...seo, siteUrl: event.target.value } }
              })
            }
          />
        </label>
        <label className="ta-field">
          <span>Google Search Console verificatie</span>
          <input
            value={seo.googleSiteVerification}
            onChange={(event) =>
              onChange({
                ...content,
                site: { ...content.site, seo: { ...seo, googleSiteVerification: event.target.value } }
              })
            }
            placeholder="google-site-verification=..."
          />
        </label>
        <label className="ta-field">
          <span>Bing Webmaster verificatie</span>
          <input
            value={seo.bingSiteVerification}
            onChange={(event) =>
              onChange({
                ...content,
                site: { ...content.site, seo: { ...seo, bingSiteVerification: event.target.value } }
              })
            }
          />
        </label>
        <MediaField
          label="Standaard SEO-afbeelding (Open Graph)"
          value={seo.image}
          onChange={(value) =>
            onChange({
              ...content,
              site: { ...content.site, seo: { ...seo, image: value } }
            })
          }
        />
      </div>
    </>
  );
}

function SeoPagesEditor({ content, onChange }: Props) {
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
          <label className="ta-field ta-grid-wide ta-checkbox-field">
            <span>
              <input
                type="checkbox"
                checked={page.noindex === true}
                onChange={(event) => updatePage({ ...page, noindex: event.target.checked })}
              />{" "}
              Niet indexeren (noindex)
            </span>
          </label>
        </div>
        <GoogleSerpPreview pageKey={selectedKey} title={page.title} description={page.description} />
        <p className="ta-seo-hint">
          Tip: houd titels onder ~60 tekens en descriptions rond 140–160 tekens voor Google-previews.
        </p>
      </div>
    </div>
  );
}

export function SeoPanel({ content, onChange, onSave, saving }: SeoPanelProps) {
  const [view, setView] = useState<SeoView>("site");

  return (
    <div className="ta-stack-panel">
      <AdminFilterChips
        value={view}
        onChange={(value) => setView(value as SeoView)}
        options={[
          { value: "site", label: "Site-instellingen" },
          { value: "pages", label: "Per pagina" }
        ]}
      />
      {view === "site" ? (
        <>
          <SeoSiteSettings content={content} onChange={onChange} />
          <FormSaveBar onSave={onSave} saving={saving} />
        </>
      ) : null}
      {view === "pages" ? (
        <>
          <SeoPagesEditor content={content} onChange={onChange} />
          <FormSaveBar onSave={onSave} saving={saving} />
        </>
      ) : null}
    </div>
  );
}
