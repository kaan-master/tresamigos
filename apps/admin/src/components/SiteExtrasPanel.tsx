import type { SiteContent } from "@tresamigos/types";
import { MediaField } from "./MediaPickerModal";

function updateSite(content: SiteContent, patch: Partial<SiteContent["site"]>) {
  return { ...content, site: { ...content.site, ...patch } };
}

export function OpeningHoursEditor({
  content,
  onChange
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}) {
  const hours = content.site.openingHours;

  return (
    <section className="ta-location-editor" style={{ marginTop: 24 }}>
      <h3 className="ta-section-title">Openingstijden</h3>
      <p className="ta-seo-hint">Google-achtige groepen: label (bijv. Mon–Thu) + uren op één regel.</p>
      <div className="ta-grid">
        <label className="ta-field">
          <span>Eyebrow</span>
          <input
            value={hours.eyebrow}
            onChange={(event) =>
              onChange(updateSite(content, { openingHours: { ...hours, eyebrow: event.target.value } }))
            }
          />
        </label>
        <label className="ta-field">
          <span>Titel</span>
          <input
            value={hours.title}
            onChange={(event) => onChange(updateSite(content, { openingHours: { ...hours, title: event.target.value } }))}
          />
        </label>
        <label className="ta-field">
          <span>Sectielabel</span>
          <input
            value={hours.sectionLabel}
            onChange={(event) =>
              onChange(updateSite(content, { openingHours: { ...hours, sectionLabel: event.target.value } }))
            }
          />
        </label>
        <label className="ta-field">
          <span>Samenvatting</span>
          <input
            value={hours.summary}
            onChange={(event) => onChange(updateSite(content, { openingHours: { ...hours, summary: event.target.value } }))}
          />
        </label>
        <label className="ta-field">
          <span>CTA label</span>
          <input
            value={hours.ctaLabel}
            onChange={(event) => onChange(updateSite(content, { openingHours: { ...hours, ctaLabel: event.target.value } }))}
          />
        </label>
        <label className="ta-field">
          <span>CTA URL</span>
          <input
            value={hours.ctaUrl}
            onChange={(event) => onChange(updateSite(content, { openingHours: { ...hours, ctaUrl: event.target.value } }))}
          />
        </label>
      </div>
      <div className="ta-data-list" style={{ marginTop: 16 }}>
        {hours.groups.map((group, index) => (
          <div className="ta-data-row" key={`${group.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
            <input
              value={group.label}
              onChange={(event) => {
                const groups = [...hours.groups];
                groups[index] = { ...groups[index], label: event.target.value };
                onChange(updateSite(content, { openingHours: { ...hours, groups } }));
              }}
            />
            <input
              value={group.hours}
              onChange={(event) => {
                const groups = [...hours.groups];
                groups[index] = { ...groups[index], hours: event.target.value };
                onChange(updateSite(content, { openingHours: { ...hours, groups } }));
              }}
            />
            <button
              className="ta-btn ta-btn-ghost"
              type="button"
              onClick={() =>
                onChange(updateSite(content, { openingHours: { ...hours, groups: hours.groups.filter((_, i) => i !== index) } }))
              }
            >
              Verwijder
            </button>
          </div>
        ))}
      </div>
      <button
        className="ta-btn ta-btn-ghost"
        type="button"
        style={{ marginTop: 12 }}
        onClick={() =>
          onChange(
            updateSite(content, {
              openingHours: { ...hours, groups: [...hours.groups, { label: "Nieuwe groep", hours: "11 am – 10 pm" }] }
            })
          )
        }
      >
        Groep toevoegen
      </button>
    </section>
  );
}

export function OurStoryEditor({
  content,
  onChange
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}) {
  const story = content.site.ourStory;

  return (
    <section className="ta-location-editor" style={{ marginTop: 24 }}>
      <h3 className="ta-section-title">Our Story</h3>
      <div className="ta-grid">
        <label className="ta-field">
          <span>Eyebrow</span>
          <input value={story.eyebrow} onChange={(event) => onChange(updateSite(content, { ourStory: { ...story, eyebrow: event.target.value } }))} />
        </label>
        <label className="ta-field">
          <span>Titel</span>
          <input value={story.title} onChange={(event) => onChange(updateSite(content, { ourStory: { ...story, title: event.target.value } }))} />
        </label>
        <label className="ta-field ta-grid-wide">
          <span>Intro</span>
          <textarea value={story.intro} onChange={(event) => onChange(updateSite(content, { ourStory: { ...story, intro: event.target.value } }))} rows={3} />
        </label>
        <label className="ta-field ta-grid-wide">
          <span>Openingstijden samenvatting</span>
          <input value={story.scheduleSummary} onChange={(event) => onChange(updateSite(content, { ourStory: { ...story, scheduleSummary: event.target.value } }))} />
        </label>
        <MediaField
          label="Hero afbeelding"
          value={story.heroImage}
          onChange={(value) => onChange(updateSite(content, { ourStory: { ...story, heroImage: value } }))}
        />
        <MediaField
          label="Zij-afbeelding"
          value={story.sideImage}
          onChange={(value) => onChange(updateSite(content, { ourStory: { ...story, sideImage: value } }))}
        />
      </div>
      {story.paragraphs.map((paragraph, index) => (
        <label className="ta-field ta-grid-wide" key={`story-${index}`} style={{ marginTop: 12 }}>
          <span>Alinea {index + 1}</span>
          <textarea
            value={paragraph}
            rows={4}
            onChange={(event) => {
              const paragraphs = [...story.paragraphs];
              paragraphs[index] = event.target.value;
              onChange(updateSite(content, { ourStory: { ...story, paragraphs } }));
            }}
          />
        </label>
      ))}
    </section>
  );
}

export function PromoMailEditor({
  content,
  onChange
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}) {
  const promo = content.site.promoPopup;
  const mail = content.site.mailRelay;

  return (
    <>
      <section className="ta-location-editor" style={{ marginTop: 24 }}>
        <h3 className="ta-section-title">10% korting popup</h3>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Vertraging (sec)</span>
            <input
              type="number"
              min={5}
              max={120}
              value={promo.delaySeconds}
              onChange={(event) =>
                onChange(updateSite(content, { promoPopup: { ...promo, delaySeconds: Number(event.target.value) || 18 } }))
              }
            />
          </label>
          <label className="ta-field">
            <span>Kortingscode</span>
            <input
              value={promo.discountCode}
              onChange={(event) => onChange(updateSite(content, { promoPopup: { ...promo, discountCode: event.target.value } }))}
            />
          </label>
          <label className="ta-field">
            <span>Titel</span>
            <input value={promo.title} onChange={(event) => onChange(updateSite(content, { promoPopup: { ...promo, title: event.target.value } }))} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Ondertitel</span>
            <input value={promo.subtitle} onChange={(event) => onChange(updateSite(content, { promoPopup: { ...promo, subtitle: event.target.value } }))} />
          </label>
          <MediaField
            label="Popup afbeelding"
            value={promo.image}
            onChange={(value) => onChange(updateSite(content, { promoPopup: { ...promo, image: value } }))}
          />
        </div>
      </section>

      <section className="ta-location-editor" style={{ marginTop: 24 }}>
        <h3 className="ta-section-title">Mail relay (SMTP via .env)</h3>
        <p className="ta-seo-hint">SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS en SMTP_FROM in .env. Shortcodes: {"{{firstName}}"}, {"{{lastName}}"}, {"{{discountCode}}"}.</p>
        <div className="ta-grid">
          <label className="ta-field">
            <span>Mail versturen</span>
            <select
              value={mail.enabled ? "1" : "0"}
              onChange={(event) => onChange(updateSite(content, { mailRelay: { ...mail, enabled: event.target.value === "1" } }))}
            >
              <option value="0">Uit</option>
              <option value="1">Aan</option>
            </select>
          </label>
          <label className="ta-field">
            <span>From name</span>
            <input value={mail.fromName} onChange={(event) => onChange(updateSite(content, { mailRelay: { ...mail, fromName: event.target.value } }))} />
          </label>
          <label className="ta-field">
            <span>Reply-to</span>
            <input value={mail.replyTo} onChange={(event) => onChange(updateSite(content, { mailRelay: { ...mail, replyTo: event.target.value } }))} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Onderwerp</span>
            <input value={mail.subject} onChange={(event) => onChange(updateSite(content, { mailRelay: { ...mail, subject: event.target.value } }))} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Body template</span>
            <textarea value={mail.bodyTemplate} rows={8} onChange={(event) => onChange(updateSite(content, { mailRelay: { ...mail, bodyTemplate: event.target.value } }))} />
          </label>
        </div>
      </section>
    </>
  );
}

export function ContactFormEditor({
  content,
  onChange
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}) {
  const form = content.site.contactForm;

  return (
    <section className="ta-location-editor" style={{ marginTop: 24 }}>
      <h3 className="ta-section-title">Contactformulier</h3>
      <p className="ta-seo-hint">Berichten gaan naar het footer e-mailadres via SMTP (mail relay aan in .env).</p>
      <div className="ta-grid">
        <label className="ta-field">
          <span>Formulier aan</span>
          <select
            value={form.enabled ? "1" : "0"}
            onChange={(event) => onChange(updateSite(content, { contactForm: { ...form, enabled: event.target.value === "1" } }))}
          >
            <option value="1">Aan</option>
            <option value="0">Uit</option>
          </select>
        </label>
        <label className="ta-field">
          <span>Titel</span>
          <input value={form.title} onChange={(event) => onChange(updateSite(content, { contactForm: { ...form, title: event.target.value } }))} />
        </label>
        <label className="ta-field ta-grid-wide">
          <span>Intro</span>
          <textarea value={form.intro} rows={3} onChange={(event) => onChange(updateSite(content, { contactForm: { ...form, intro: event.target.value } }))} />
        </label>
        <label className="ta-field ta-grid-wide">
          <span>Succesbericht</span>
          <input value={form.successMessage} onChange={(event) => onChange(updateSite(content, { contactForm: { ...form, successMessage: event.target.value } }))} />
        </label>
        <label className="ta-field ta-grid-wide">
          <span>Mail onderwerp (intern)</span>
          <input value={form.notifySubject} onChange={(event) => onChange(updateSite(content, { contactForm: { ...form, notifySubject: event.target.value } }))} />
        </label>
        <MediaField
          label="Formulier afbeelding"
          value={form.image}
          onChange={(value) => onChange(updateSite(content, { contactForm: { ...form, image: value } }))}
        />
      </div>
    </section>
  );
}

export function ReviewsEditor({
  content,
  onChange
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
}) {
  const reviews = content.site.reviews;

  return (
    <section className="ta-location-editor" style={{ marginTop: 24 }}>
      <h3 className="ta-section-title">Google reviews</h3>
      <p className="ta-seo-hint">Met GOOGLE_PLACES_API_KEY + Place ID worden live reviews opgehaald (min. sterren filter). Anders curated lijst.</p>
      <div className="ta-grid">
        <label className="ta-field">
          <span>Google Place ID</span>
          <input
            value={reviews.googlePlaceId}
            onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, googlePlaceId: event.target.value } }))}
          />
        </label>
        <label className="ta-field">
          <span>Min. sterren</span>
          <input
            type="number"
            min={1}
            max={5}
            value={reviews.minRating}
            onChange={(event) =>
              onChange(updateSite(content, { reviews: { ...reviews, minRating: Number(event.target.value) || 4 } }))
            }
          />
        </label>
        <label className="ta-field">
          <span>Titel</span>
          <input value={reviews.title} onChange={(event) => onChange(updateSite(content, { reviews: { ...reviews, title: event.target.value } }))} />
        </label>
      </div>
      {reviews.curated.map((review, index) => (
        <label className="ta-field ta-grid-wide" key={review.id} style={{ marginTop: 12 }}>
          <span>Review {index + 1} ({review.rating}★)</span>
          <textarea
            rows={3}
            value={review.text}
            onChange={(event) => {
              const curated = [...reviews.curated];
              curated[index] = { ...curated[index], text: event.target.value };
              onChange(updateSite(content, { reviews: { ...reviews, curated } }));
            }}
          />
        </label>
      ))}
    </section>
  );
}
