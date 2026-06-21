import { useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { AdminFilterChips } from "./AdminListUi";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { ContactFormEditor, PromoMailEditor } from "./SiteExtrasPanel";

type FooterView = "footer" | "promo" | "contact";

export function FooterPanel({
  content,
  onChange,
  onSave,
  saving
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
} & PanelSaveProps) {
  const [view, setView] = useState<FooterView>("footer");
  const footer = content.site.footer;

  return (
    <div className="ta-stack-panel">
      <AdminFilterChips
        value={view}
        onChange={(value) => setView(value as FooterView)}
        options={[
          { value: "footer", label: "Footer" },
          { value: "promo", label: "Promo mail" },
          { value: "contact", label: "Contactformulier" }
        ]}
      />

      {view === "footer" ? (
        <>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Footer title</span>
            <input
              value={footer.title}
              onChange={(event) =>
                onChange({ ...content, site: { ...content.site, footer: { ...footer, title: event.target.value } } })
              }
            />
          </label>
          <label className="ta-field">
            <span>E-mail</span>
            <input
              value={footer.email}
              onChange={(event) =>
                onChange({ ...content, site: { ...content.site, footer: { ...footer, email: event.target.value } } })
              }
            />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Footer intro</span>
            <input
              value={footer.intro}
              onChange={(event) =>
                onChange({ ...content, site: { ...content.site, footer: { ...footer, intro: event.target.value } } })
              }
            />
          </label>
          <label className="ta-field">
            <span>Instagram URL</span>
            <input
              value={footer.instagramUrl}
              onChange={(event) =>
                onChange({ ...content, site: { ...content.site, footer: { ...footer, instagramUrl: event.target.value } } })
              }
            />
          </label>
          <label className="ta-field">
            <span>TikTok URL</span>
            <input
              value={footer.tiktokUrl}
              onChange={(event) =>
                onChange({ ...content, site: { ...content.site, footer: { ...footer, tiktokUrl: event.target.value } } })
              }
            />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Copyright</span>
            <input
              value={footer.copyright}
              onChange={(event) =>
                onChange({ ...content, site: { ...content.site, footer: { ...footer, copyright: event.target.value } } })
              }
            />
          </label>
        </div>
        <FormSaveBar onSave={onSave} saving={saving} />
        </>
      ) : null}

      {view === "promo" ? (
        <>
          <PromoMailEditor content={content} onChange={onChange} />
          <FormSaveBar onSave={onSave} saving={saving} />
        </>
      ) : null}
      {view === "contact" ? (
        <>
          <ContactFormEditor content={content} onChange={onChange} />
          <FormSaveBar onSave={onSave} saving={saving} />
        </>
      ) : null}
    </div>
  );
}
