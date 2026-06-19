import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'
import { AdminPreviewImage } from './AdminOptimizedImage'

export type AdminImagePreview = {
  src: string
  alt: string
  label: string
}

type AdminImagePreviewModalProps = {
  preview: AdminImagePreview | null
  onClose: () => void
}

export default function AdminImagePreviewModal({ preview, onClose }: AdminImagePreviewModalProps) {
  useEffect(() => {
    if (!preview) {
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
  }, [onClose, preview])

  if (!preview || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="product-admin-preview-backdrop is-fast" role="presentation" onClick={onClose}>
      <div
        className="product-admin-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label={preview.label}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-secondary product-admin-preview-close"
          onClick={onClose}
          aria-label="Sluit grote preview"
        >
          <FiX aria-hidden="true" />
          Sluit
        </button>
        <div className="product-admin-preview-image-frame">
          <AdminPreviewImage src={preview.src} alt={preview.alt} />
        </div>
        <p>{preview.label}</p>
      </div>
    </div>,
    document.body,
  )
}
