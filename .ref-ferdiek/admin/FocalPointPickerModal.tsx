import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { FiCrosshair, FiX } from 'react-icons/fi'
import { clampFocal, focalFromContainImagePointer, mediaFocusStyle } from '../mediaFocus'

export type FocalPreviewFrame = {
  label: string
  aspectRatio: number
}

type FocalPointPickerModalProps = {
  open: boolean
  imageSrc: string
  alt: string
  title: string
  focalX: number
  focalY: number
  previews?: FocalPreviewFrame[]
  onClose: () => void
  onSave: (focalX: number, focalY: number) => void
}

const defaultPreviews: FocalPreviewFrame[] = [
  { label: 'Shop kaart', aspectRatio: 4 / 4.65 },
  { label: 'Hero breed', aspectRatio: 16 / 9 },
  { label: 'Vierkant', aspectRatio: 1 },
]

export default function FocalPointPickerModal({
  open,
  imageSrc,
  alt,
  title,
  focalX,
  focalY,
  previews = defaultPreviews,
  onClose,
  onSave,
}: FocalPointPickerModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [draftX, setDraftX] = useState(focalX)
  const [draftY, setDraftY] = useState(focalY)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setDraftX(focalX)
    setDraftY(focalY)
  }, [focalX, focalY, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.naturalWidth || !image.naturalHeight) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const next = focalFromContainImagePointer({
      containerWidth: rect.width,
      containerHeight: rect.height,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      pointerX: clientX,
      pointerY: clientY,
      containerLeft: rect.left,
      containerTop: rect.top,
    })

    setDraftX(next.x)
    setDraftY(next.y)
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return
    }

    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return
    }

    setIsDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  if (!open || typeof document === 'undefined') {
    return null
  }

  const focusStyle = mediaFocusStyle(draftX, draftY)

  return createPortal(
    <div className="focal-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="focal-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="focal-picker-head">
          <div>
            <p className="product-label">Beeld focus</p>
            <h2>{title}</h2>
            <p className="admin-muted">Klik of sleep op de afbeelding. Rechts zie je direct hoe kaarten en hero&apos;s croppen.</p>
          </div>
          <button type="button" className="btn btn-secondary focal-picker-close" onClick={onClose} aria-label="Sluit focus editor">
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="focal-picker-layout">
          <div
            ref={canvasRef}
            className={`focal-picker-canvas${isDragging ? ' is-dragging' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img ref={imageRef} src={imageSrc} alt={alt} draggable={false} style={{ ...focusStyle, objectFit: 'contain' }} />
            <span
              className="focal-picker-marker"
              style={{ left: `${clampFocal(draftX)}%`, top: `${clampFocal(draftY)}%` }}
              aria-hidden="true"
            >
              <FiCrosshair />
            </span>
            <span className="focal-picker-crosshair-h" style={{ top: `${clampFocal(draftY)}%` }} aria-hidden="true" />
            <span className="focal-picker-crosshair-v" style={{ left: `${clampFocal(draftX)}%` }} aria-hidden="true" />
          </div>

          <aside className="focal-picker-sidebar">
            <p className="product-label">Live previews</p>
            <div className="focal-picker-preview-grid">
              {previews.map((preview) => (
                <figure key={preview.label} className="focal-picker-preview">
                  <div className="focal-picker-preview-frame" style={{ aspectRatio: String(preview.aspectRatio) }}>
                    <img src={imageSrc} alt="" style={focusStyle} />
                  </div>
                  <figcaption>{preview.label}</figcaption>
                </figure>
              ))}
            </div>
            <div className="focal-picker-values">
              <span>Focus: {draftX}% / {draftY}%</span>
            </div>
          </aside>
        </div>

        <footer className="focal-picker-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuleren
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onSave(draftX, draftY)
              onClose()
            }}
          >
            Focus opslaan
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
