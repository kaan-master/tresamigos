import type { LegalPageContent } from '../legalContent'

type LegalPageContentEditorProps = {
  content: LegalPageContent
  onChange: (next: LegalPageContent) => void
  disabled?: boolean
}

function updateField<K extends keyof LegalPageContent>(
  content: LegalPageContent,
  key: K,
  value: LegalPageContent[K],
  onChange: (next: LegalPageContent) => void,
) {
  onChange({ ...content, [key]: value })
}

export default function LegalPageContentEditor({ content, onChange, disabled = false }: LegalPageContentEditorProps) {
  return (
    <section className="admin-home-content-panel form-field-wide">
      <div>
        <p className="product-label">Pagina-inhoud</p>
        <h3>Teksten voor deze pagina</h3>
        <p className="admin-muted">Vul hier de tekstuele inhoud in. Afbeeldingen zijn optioneel via SEO (één lichte OG-afbeelding is voldoende).</p>
      </div>

      <label>
        Eyebrow
        <input value={content.eyebrow} disabled={disabled} onChange={(event) => updateField(content, 'eyebrow', event.target.value, onChange)} />
      </label>
      <label className="form-field-wide">
        Titel
        <input value={content.title} disabled={disabled} onChange={(event) => updateField(content, 'title', event.target.value, onChange)} />
      </label>
      <label className="form-field-wide">
        Intro
        <textarea rows={3} value={content.intro} disabled={disabled} onChange={(event) => updateField(content, 'intro', event.target.value, onChange)} />
      </label>

      {content.sections.map((section, index) => (
        <div key={`section-${index}`} className="admin-home-content-card-editor">
          <p className="product-label">Sectie {index + 1}</p>
          <label>
            Titel
            <input
              value={section.title}
              disabled={disabled}
              onChange={(event) => {
                const sections = content.sections.map((entry, sectionIndex) =>
                  sectionIndex === index ? { ...entry, title: event.target.value } : entry,
                )
                updateField(content, 'sections', sections, onChange)
              }}
            />
          </label>
          {section.body.map((paragraph, paragraphIndex) => (
            <label key={`section-${index}-paragraph-${paragraphIndex}`} className="form-field-wide">
              Alinea {paragraphIndex + 1}
              <textarea
                rows={3}
                value={paragraph}
                disabled={disabled}
                onChange={(event) => {
                  const sections = content.sections.map((entry, sectionIndex) => {
                    if (sectionIndex !== index) {
                      return entry
                    }

                    const body = entry.body.map((line, lineIndex) => (lineIndex === paragraphIndex ? event.target.value : line))
                    return { ...entry, body }
                  })
                  updateField(content, 'sections', sections, onChange)
                }}
              />
            </label>
          ))}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={disabled}
            onClick={() => {
              const sections = content.sections.map((entry, sectionIndex) =>
                sectionIndex === index ? { ...entry, body: [...entry.body, ''] } : entry,
              )
              updateField(content, 'sections', sections, onChange)
            }}
          >
            Alinea toevoegen
          </button>
        </div>
      ))}

      <label>
        Sidebar titel
        <input value={content.asideTitle} disabled={disabled} onChange={(event) => updateField(content, 'asideTitle', event.target.value, onChange)} />
      </label>
      {content.asideBody.map((paragraph, index) => (
        <label key={`aside-${index}`} className="form-field-wide">
          Sidebar alinea {index + 1}
          <textarea
            rows={2}
            value={paragraph}
            disabled={disabled}
            onChange={(event) => {
              const asideBody = content.asideBody.map((entry, entryIndex) => (entryIndex === index ? event.target.value : entry))
              updateField(content, 'asideBody', asideBody, onChange)
            }}
          />
        </label>
      ))}
    </section>
  )
}
