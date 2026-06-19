import { useState } from 'react'
import { FiFolder, FiX } from 'react-icons/fi'
import { resolveApiAssetUrl } from '../api'
import AdminMediaPickerModal from './AdminMediaPickerModal'
import AdminOptimizedImage from './AdminOptimizedImage'

type AdminSeoImageFieldProps = {
  token: string
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function AdminSeoImageField({
  token,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Nog geen afbeelding gekozen',
}: AdminSeoImageFieldProps) {
  const [open, setOpen] = useState(false)
  const previewUrl = resolveApiAssetUrl(value)

  return (
    <>
      <label className="admin-seo-image-field form-field-wide">
        <span>{label}</span>
        <div className="admin-seo-image-row">
          <div className={`admin-seo-image-preview${previewUrl ? '' : ' is-empty'}`}>
            {previewUrl ? (
              <AdminOptimizedImage src={value} alt="" thumbnailWidth={160} fill />
            ) : (
              <span>Geen preview</span>
            )}
          </div>
          <div className="admin-seo-image-meta">
            <input readOnly value={value} placeholder={placeholder} disabled={disabled} />
            <div className="admin-seo-image-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)} disabled={disabled}>
                <FiFolder aria-hidden="true" />
                Kies uit mediabibliotheek
              </button>
              {value ? (
                <button type="button" className="btn btn-secondary" onClick={() => onChange('')} disabled={disabled}>
                  <FiX aria-hidden="true" />
                  Wissen
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </label>

      <AdminMediaPickerModal
        token={token}
        open={open}
        title={label}
        description="Klik op een afbeelding om deze direct te kiezen."
        selectionMode="single"
        onClose={() => setOpen(false)}
        onConfirm={(assets) => {
          const asset = assets[0]
          if (asset) {
            onChange(asset.url)
          }
          setOpen(false)
        }}
      />
    </>
  )
}
