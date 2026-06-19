import type { HomeContent } from '../homeContent'
import AdminSeoImageField from './AdminSeoImageField'

type HomePageContentEditorProps = {
  token: string
  content: HomeContent
  onChange: (next: HomeContent) => void
  disabled?: boolean
}

function updateField<K extends keyof HomeContent>(
  content: HomeContent,
  key: K,
  value: HomeContent[K],
  onChange: (next: HomeContent) => void,
) {
  onChange({ ...content, [key]: value })
}

export default function HomePageContentEditor({ token, content, onChange, disabled = false }: HomePageContentEditorProps) {
  return (
    <section className="admin-home-content-panel form-field-wide">
      <div>
        <p className="product-label">Homepage teksten & beelden</p>
        <h3>Pagina-inhoud via SEO</h3>
        <p className="admin-muted">
          Alles wat je hier invult vervangt de standaard homepage. Laat een afbeeldingsveld leeg om het standaardbeeld te behouden totdat je een beeld kiest.
        </p>
      </div>

      <details open className="admin-home-content-group">
        <summary>Hero teksten</summary>
        <label>
          Titel
          <input value={content.heroTitle} disabled={disabled} onChange={(event) => updateField(content, 'heroTitle', event.target.value, onChange)} />
        </label>
        <label>
          Tagline
          <input value={content.heroTagline} disabled={disabled} onChange={(event) => updateField(content, 'heroTagline', event.target.value, onChange)} />
        </label>
        <label>
          Knop 1
          <input value={content.heroCtaPrimary} disabled={disabled} onChange={(event) => updateField(content, 'heroCtaPrimary', event.target.value, onChange)} />
        </label>
        <label>
          Knop 2
          <input value={content.heroCtaSecondary} disabled={disabled} onChange={(event) => updateField(content, 'heroCtaSecondary', event.target.value, onChange)} />
        </label>
      </details>

      <details className="admin-home-content-group">
        <summary>Atelierselectie (3 kaarten)</summary>
        <label>
          Eyebrow
          <input value={content.featureEyebrow} disabled={disabled} onChange={(event) => updateField(content, 'featureEyebrow', event.target.value, onChange)} />
        </label>
        <label>
          Titel
          <input value={content.featureTitle} disabled={disabled} onChange={(event) => updateField(content, 'featureTitle', event.target.value, onChange)} />
        </label>
        <label className="form-field-wide">
          Tekst
          <textarea rows={3} value={content.featureBody} disabled={disabled} onChange={(event) => updateField(content, 'featureBody', event.target.value, onChange)} />
        </label>
        <label>
          Knoptekst
          <input value={content.featureCta} disabled={disabled} onChange={(event) => updateField(content, 'featureCta', event.target.value, onChange)} />
        </label>
        {content.featureCards.map((card, index) => (
          <div key={`feature-${index}`} className="admin-home-content-card-editor">
            <p className="product-label">Kaart {index + 1}</p>
            <label>
              Titel
              <input
                value={card.title}
                disabled={disabled}
                onChange={(event) => {
                  const featureCards = content.featureCards.map((entry, cardIndex) =>
                    cardIndex === index ? { ...entry, title: event.target.value } : entry,
                  )
                  updateField(content, 'featureCards', featureCards, onChange)
                }}
              />
            </label>
            <label className="form-field-wide">
              Tekst
              <textarea
                rows={2}
                value={card.copy}
                disabled={disabled}
                onChange={(event) => {
                  const featureCards = content.featureCards.map((entry, cardIndex) =>
                    cardIndex === index ? { ...entry, copy: event.target.value } : entry,
                  )
                  updateField(content, 'featureCards', featureCards, onChange)
                }}
              />
            </label>
            <AdminSeoImageField
              token={token}
              label={`Afbeelding kaart ${index + 1}`}
              value={card.image}
              disabled={disabled}
              onChange={(image) => {
                const featureCards = content.featureCards.map((entry, cardIndex) =>
                  cardIndex === index ? { ...entry, image } : entry,
                )
                updateField(content, 'featureCards', featureCards, onChange)
              }}
            />
          </div>
        ))}
      </details>

      <details className="admin-home-content-group">
        <summary>Collectie</summary>
        <label>
          Eyebrow
          <input value={content.collectionEyebrow} disabled={disabled} onChange={(event) => updateField(content, 'collectionEyebrow', event.target.value, onChange)} />
        </label>
        <label>
          Titel
          <input value={content.collectionTitle} disabled={disabled} onChange={(event) => updateField(content, 'collectionTitle', event.target.value, onChange)} />
        </label>
        <label className="form-field-wide">
          Subtitel
          <textarea rows={2} value={content.collectionSubtitle} disabled={disabled} onChange={(event) => updateField(content, 'collectionSubtitle', event.target.value, onChange)} />
        </label>
        {content.collectionItems.map((item, index) => (
          <div key={`collection-${index}`} className="admin-home-content-card-editor">
            <p className="product-label">Product {index + 1}</p>
            <label>
              Naam
              <input
                value={item.name}
                disabled={disabled}
                onChange={(event) => {
                  const collectionItems = content.collectionItems.map((entry, itemIndex) =>
                    itemIndex === index ? { ...entry, name: event.target.value } : entry,
                  )
                  updateField(content, 'collectionItems', collectionItems, onChange)
                }}
              />
            </label>
            <label>
              Slug
              <input
                value={item.slug}
                disabled={disabled}
                onChange={(event) => {
                  const collectionItems = content.collectionItems.map((entry, itemIndex) =>
                    itemIndex === index ? { ...entry, slug: event.target.value } : entry,
                  )
                  updateField(content, 'collectionItems', collectionItems, onChange)
                }}
              />
            </label>
            <AdminSeoImageField
              token={token}
              label={`Afbeelding ${item.name || `product ${index + 1}`}`}
              value={item.image}
              disabled={disabled}
              onChange={(image) => {
                const collectionItems = content.collectionItems.map((entry, itemIndex) =>
                  itemIndex === index ? { ...entry, image } : entry,
                )
                updateField(content, 'collectionItems', collectionItems, onChange)
              }}
            />
          </div>
        ))}
      </details>

      <details className="admin-home-content-group">
        <summary>Concept & filosofie</summary>
        <label>
          Concept eyebrow
          <input value={content.storyEyebrow} disabled={disabled} onChange={(event) => updateField(content, 'storyEyebrow', event.target.value, onChange)} />
        </label>
        <label className="form-field-wide">
          Concept titel
          <textarea rows={2} value={content.storyTitle} disabled={disabled} onChange={(event) => updateField(content, 'storyTitle', event.target.value, onChange)} />
        </label>
        {content.storyParagraphs.map((paragraph, index) => (
          <label key={`story-${index}`} className="form-field-wide">
            Concept alinea {index + 1}
            <textarea
              rows={3}
              value={paragraph}
              disabled={disabled}
              onChange={(event) => {
                const storyParagraphs = content.storyParagraphs.map((entry, paragraphIndex) =>
                  paragraphIndex === index ? event.target.value : entry,
                )
                updateField(content, 'storyParagraphs', storyParagraphs, onChange)
              }}
            />
          </label>
        ))}
        <label>
          Filosofie eyebrow
          <input value={content.philosophyEyebrow} disabled={disabled} onChange={(event) => updateField(content, 'philosophyEyebrow', event.target.value, onChange)} />
        </label>
        <label>
          Filosofie titel
          <input value={content.philosophyTitle} disabled={disabled} onChange={(event) => updateField(content, 'philosophyTitle', event.target.value, onChange)} />
        </label>
        <label className="form-field-wide">
          Filosofie tekst
          <textarea rows={4} value={content.philosophyBody} disabled={disabled} onChange={(event) => updateField(content, 'philosophyBody', event.target.value, onChange)} />
        </label>
        <AdminSeoImageField
          token={token}
          label="Filosofie afbeelding"
          value={content.philosophyImage}
          disabled={disabled}
          onChange={(philosophyImage) => updateField(content, 'philosophyImage', philosophyImage, onChange)}
        />
        <label>
          Filosofie knop
          <input value={content.philosophyCta} disabled={disabled} onChange={(event) => updateField(content, 'philosophyCta', event.target.value, onChange)} />
        </label>
      </details>
    </section>
  )
}
