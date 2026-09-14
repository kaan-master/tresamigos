import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { clampFocal, focalFromContainImagePointer, mediaFocusStyle } from "../lib/mediaFocus";

export type FocalPreviewFrame = {
  label: string;
  aspectRatio: number;
};

type FocalPointPickerModalProps = {
  open: boolean;
  imageSrc: string;
  alt?: string;
  title: string;
  focalX: number;
  focalY: number;
  previews?: FocalPreviewFrame[];
  onClose: () => void;
  onSave: (focalX: number, focalY: number) => void;
};

const defaultPreviews: FocalPreviewFrame[] = [
  { label: "Hero breed", aspectRatio: 16 / 9 },
  { label: "Paneel", aspectRatio: 4 / 5 },
  { label: "Vierkant", aspectRatio: 1 }
];

export function FocalPointPickerModal({
  open,
  imageSrc,
  alt = "",
  title,
  focalX,
  focalY,
  previews = defaultPreviews,
  onClose,
  onSave
}: FocalPointPickerModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [draftX, setDraftX] = useState(focalX);
  const [draftY, setDraftY] = useState(focalY);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftX(focalX);
    setDraftY(focalY);
  }, [focalX, focalY, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !image.naturalWidth || !image.naturalHeight) return;

    const rect = canvas.getBoundingClientRect();
    const next = focalFromContainImagePointer({
      containerWidth: rect.width,
      containerHeight: rect.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      pointerX: clientX,
      pointerY: clientY,
      containerLeft: rect.left,
      containerTop: rect.top
    });

    setDraftX(next.x);
    setDraftY(next.y);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromPointer(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!open || typeof document === "undefined") return null;

  const focusStyle = mediaFocusStyle(draftX, draftY);

  return createPortal(
    <div className="ta-media-modal-backdrop ta-focal-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ta-media-modal-panel ta-focal-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ta-media-modal-head">
          <div>
            <h3>{title}</h3>
            <p>Klik of sleep op de afbeelding om het focuspunt te zetten. Rechts zie je direct hoe uitsnedes croppen.</p>
          </div>
          <button className="ta-btn ta-btn-ghost" type="button" onClick={onClose} aria-label="Sluiten">
            ×
          </button>
        </header>

        <div className="ta-focal-picker-layout">
          <div
            ref={canvasRef}
            className={`ta-focal-picker-canvas${isDragging ? " is-dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img ref={imageRef} src={imageSrc} alt={alt} draggable={false} style={{ ...focusStyle, objectFit: "contain" }} />
            <span
              className="ta-focal-picker-marker"
              style={{ left: `${clampFocal(draftX)}%`, top: `${clampFocal(draftY)}%` }}
              aria-hidden="true"
            />
            <span className="ta-focal-picker-crosshair-h" style={{ top: `${clampFocal(draftY)}%` }} aria-hidden="true" />
            <span className="ta-focal-picker-crosshair-v" style={{ left: `${clampFocal(draftX)}%` }} aria-hidden="true" />
          </div>

          <aside className="ta-focal-picker-sidebar">
            <p className="ta-eyebrow">Live previews</p>
            <div className="ta-focal-picker-preview-grid">
              {previews.map((preview) => (
                <figure key={preview.label} className="ta-focal-picker-preview">
                  <div className="ta-focal-picker-preview-frame" style={{ aspectRatio: String(preview.aspectRatio) }}>
                    <img src={imageSrc} alt="" style={focusStyle} />
                  </div>
                  <figcaption>{preview.label}</figcaption>
                </figure>
              ))}
            </div>
            <p className="ta-muted">
              Focus: {draftX}% / {draftY}%
            </p>
          </aside>
        </div>

        <footer className="ta-focal-picker-actions">
          <button className="ta-btn ta-btn-ghost" type="button" onClick={onClose}>
            Annuleren
          </button>
          <button
            className="ta-btn ta-btn-primary"
            type="button"
            onClick={() => {
              onSave(draftX, draftY);
              onClose();
            }}
          >
            Focus opslaan
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
