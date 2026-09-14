import { useState } from "react";
import {
  PAGE_MEDIA_PAGE_IDS,
  PAGE_MEDIA_PAGE_LABELS,
  type PageMediaPageId,
  type PageMediaSettings,
  type PageMediaSlot,
  type SiteContent
} from "@tresamigos/types";
import { DEFAULT_PAGE_MEDIA } from "@tresamigos/utils";
import { mediaAssetUrl } from "../lib/media";
import { mediaFocusStyle } from "../lib/mediaFocus";
import { FocalPointPickerModal, type FocalPreviewFrame } from "./FocalPointPickerModal";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { MediaPickerModal } from "./MediaPickerModal";

interface Props extends PanelSaveProps {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}

type SlotMeta = {
  id: string;
  label: string;
  location: string;
  format: string;
  aspectRatio: number;
  previews?: FocalPreviewFrame[];
};

const PAGE_SLOTS: Record<PageMediaPageId, SlotMeta[]> = {
  home: [
    {
      id: "showcase",
      label: "Menu-showcase",
      location: "Home · sfeerfoto naast het menu",
      format: "Showcase foto",
      aspectRatio: 3 / 4
    }
  ],
  ourStory: [
    {
      id: "hero",
      label: "Hero-achtergrond",
      location: "Ons verhaal · full-bleed hero",
      format: "Breed hero · cover",
      aspectRatio: 16 / 9
    }
  ],
  ourValue: [
    {
      id: "hero",
      label: "Hero-achtergrond",
      location: "Onze waarden · bovenkant",
      format: "Breed hero · cover",
      aspectRatio: 16 / 9
    },
    {
      id: "side",
      label: "Zij-afbeelding",
      location: "Onze waarden · naast de tekst",
      format: "Portretfoto",
      aspectRatio: 3 / 4
    },
    {
      id: "grid1",
      label: "Sfeer 1",
      location: "Waarden · atmosfeer-grid",
      format: "Gridtegel",
      aspectRatio: 1
    },
    {
      id: "grid2",
      label: "Sfeer 2",
      location: "Waarden · atmosfeer-grid",
      format: "Gridtegel",
      aspectRatio: 1
    },
    {
      id: "grid3",
      label: "Sfeer 3 (ook mobiel)",
      location: "Waarden · atmosfeer-grid",
      format: "Gridtegel",
      aspectRatio: 1
    }
  ],
  loyalty: [
    {
      id: "hero",
      label: "Hero-achtergrond",
      location: "Bovenkant loyalty-pagina",
      format: "Breed hero · cover",
      aspectRatio: 16 / 9,
      previews: [
        { label: "Hero", aspectRatio: 16 / 9 },
        { label: "Mobiel", aspectRatio: 3 / 4 }
      ]
    },
    {
      id: "guests",
      label: "Niveaus-paneel",
      location: "Naast niveaus / El Club",
      format: "Paneel · contain",
      aspectRatio: 4 / 5
    },
    {
      id: "dining",
      label: "Hoe werkt het",
      location: "Sectie ‘Hoe werkt het’",
      format: "Portretfoto",
      aspectRatio: 3 / 4
    },
    {
      id: "cheers",
      label: "Beloningen",
      location: "Sectie beloningen",
      format: "Zijfoto",
      aspectRatio: 4 / 5
    }
  ],
  franchise: [
    {
      id: "hero",
      label: "Hero-achtergrond",
      location: "Bovenkant franchise-pagina",
      format: "Breed hero · cover",
      aspectRatio: 16 / 9
    },
    {
      id: "story",
      label: "Verhaal-foto",
      location: "Franchise-verhaal sectie",
      format: "Paneelfoto",
      aspectRatio: 4 / 5
    }
  ],
  vacancy: [
    {
      id: "hero",
      label: "Hero-foto",
      location: "Werken bij ons · rechterkolom",
      format: "Hero foto",
      aspectRatio: 4 / 5
    }
  ],
  contact: [
    {
      id: "visual",
      label: "Formulierfoto",
      location: "Contact · naast het formulier",
      format: "Paneelfoto",
      aspectRatio: 4 / 5
    }
  ]
};

function getSlot(pageMedia: PageMediaSettings, pageId: PageMediaPageId, slotId: string): PageMediaSlot {
  const page = pageMedia[pageId] as Record<string, PageMediaSlot>;
  const fallbackPage = DEFAULT_PAGE_MEDIA[pageId] as Record<string, PageMediaSlot>;
  return page[slotId] || fallbackPage[slotId] || DEFAULT_PAGE_MEDIA.loyalty.hero;
}

export function PageMediaPanel({ content, onChange, onSave, saving }: Props) {
  const [pageId, setPageId] = useState<PageMediaPageId>("home");
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);
  const [focalSlotId, setFocalSlotId] = useState<string | null>(null);

  const pageMedia = content.site.pageMedia;
  const slots = PAGE_SLOTS[pageId];

  function patchSlot(slotId: string, patch: Partial<PageMediaSlot>) {
    const current = getSlot(pageMedia, pageId, slotId);
    const nextSlot = { ...current, ...patch };
    onChange({
      ...content,
      site: {
        ...content.site,
        pageMedia: {
          ...pageMedia,
          [pageId]: {
            ...pageMedia[pageId],
            [slotId]: nextSlot
          }
        }
      }
    });
  }

  function clearSlot(slotId: string) {
    const fallback = (DEFAULT_PAGE_MEDIA[pageId] as Record<string, PageMediaSlot>)[slotId];
    if (fallback) patchSlot(slotId, { ...fallback });
  }

  const activeFocalMeta = focalSlotId ? slots.find((item) => item.id === focalSlotId) : null;
  const activeFocalSlot = focalSlotId ? getSlot(pageMedia, pageId, focalSlotId) : null;

  return (
    <>
      <div className="entra-toolbar entra-toolbar-wrap">
        <select value={pageId} onChange={(event) => setPageId(event.target.value as PageMediaPageId)}>
          {PAGE_MEDIA_PAGE_IDS.map((id) => (
            <option value={id} key={id}>
              {PAGE_MEDIA_PAGE_LABELS[id]}
            </option>
          ))}
        </select>
        <span className="entra-count">{slots.length} foto{slots.length === 1 ? "" : "'s"} op deze pagina</span>
      </div>

      <p className="entra-meta">Kies een pagina, wijzig de foto via de mediabibliotheek en pas zo nodig het focuspunt aan.</p>

      <div className="ta-page-media-grid">
        {slots.map((meta) => {
          const slot = getSlot(pageMedia, pageId, meta.id);
          const previewSrc = slot.src ? mediaAssetUrl(slot.src) : "";
          const focusStyle = mediaFocusStyle(slot.focalPointX, slot.focalPointY);

          return (
            <article className="ta-page-media-card" key={meta.id}>
              <div className="ta-page-media-preview" style={{ aspectRatio: String(meta.aspectRatio) }}>
                {previewSrc ? (
                  <img src={previewSrc} alt="" style={focusStyle} />
                ) : (
                  <div className="ta-page-media-empty">Geen afbeelding</div>
                )}
              </div>
              <div className="ta-page-media-meta">
                <h3>{meta.label}</h3>
                <p>{meta.location}</p>
                <p className="ta-muted">
                  {meta.format} · focus {slot.focalPointX}% / {slot.focalPointY}%
                </p>
                <div className="ta-page-media-actions">
                  <button className="ta-btn ta-btn-primary" type="button" onClick={() => setPickerSlotId(meta.id)}>
                    Wijzigen
                  </button>
                  <button
                    className="ta-btn ta-btn-ghost"
                    type="button"
                    disabled={!slot.src}
                    onClick={() => setFocalSlotId(meta.id)}
                  >
                    Focal point
                  </button>
                  <button className="ta-btn ta-btn-ghost" type="button" disabled={!slot.src} onClick={() => clearSlot(meta.id)}>
                    Standaard
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <FormSaveBar onSave={onSave} saving={saving} />

      <MediaPickerModal
        open={Boolean(pickerSlotId)}
        onClose={() => setPickerSlotId(null)}
        filter="image"
        onSelect={(url) => {
          if (pickerSlotId) {
            const selectedId = pickerSlotId;
            patchSlot(selectedId, { src: url });
            setPickerSlotId(null);
            setFocalSlotId(selectedId);
          }
        }}
      />

      <FocalPointPickerModal
        open={Boolean(focalSlotId && activeFocalSlot?.src)}
        imageSrc={activeFocalSlot?.src ? mediaAssetUrl(activeFocalSlot.src) : ""}
        title={activeFocalMeta ? `${PAGE_MEDIA_PAGE_LABELS[pageId]} · ${activeFocalMeta.label}` : "Focal point"}
        focalX={activeFocalSlot?.focalPointX ?? 50}
        focalY={activeFocalSlot?.focalPointY ?? 50}
        previews={activeFocalMeta?.previews}
        onClose={() => setFocalSlotId(null)}
        onSave={(focalPointX, focalPointY) => {
          if (focalSlotId) patchSlot(focalSlotId, { focalPointX, focalPointY });
        }}
      />
    </>
  );
}
