import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApiSitePageSeoRecord } from './api'
import { apiNewsletterSubscribe } from './api'
import {
  resolveHomeContent,
  resolveHomeHeroDesktop,
  resolveHomeHeroMobile,
} from './homeContent'
import { FaqAccordion } from './FaqAccordion'
import { mediaObjectPosition } from './mediaFocus'
import { useRevealOnScroll } from './useRevealOnScroll'
import './App.css'

const notes = [
  {
    number: '01',
    name: 'Oud Rose',
    copy: 'Een donkere roos met fluweelzachte diepte die het hart van FERDIEK chic en volwassen laat aanvoelen.',
    availability: 'Beschikbaar',
    availabilityTone: 'available',
  },
  {
    number: '02',
    name: 'Vanille',
    copy: 'Rondt de geur af met warmte en comfort, zonder de compositie zwaar of zoet te maken.',
    availability: 'Bijna uitverkocht',
    availabilityTone: 'limited',
  },
  {
    number: '03',
    name: 'Yuzu & Sakura',
    copy: 'Geven de opening helderheid en een moderne, bijna luchtige spanning op de huid.',
    availability: 'Geen voorraad',
    availabilityTone: 'unavailable',
  },
  {
    number: '04',
    name: 'Amandel & Saffraan',
    copy: 'Zorgen voor textuur, subtiele gourmand luxe en een signatuur die lang elegant blijft nazinderen.',
    availability: 'Beschikbaar',
    availabilityTone: 'available',
  },
]

const testimonials = [
  { quote: 'Hij opent rustig, maar na tien minuten ruik je ineens hoe luxe en verslavend hij eigenlijk is.', name: 'Sanne', role: 'liefhebber van verfijnde geuren' },
  { quote: 'Dit voelt als een parfum voor avonden waarop je indruk wilt maken zonder te schreeuwen.', name: 'Youssef', role: 'drager van avondgeuren' },
  { quote: 'De combinatie van roos en saffraan maakt hem volwassen, warm en echt onderscheidend.', name: 'Naomi', role: 'beauty liefhebber' },
  { quote: 'Ik kreeg complimenten terwijl de geur juist heel beheerst bleef. Dat is zeldzaam.', name: 'Mila', role: 'liefhebber van zachte luxe' },
  { quote: 'De flacon voelt luxe en het geurverloop blijft uren interessant. Heel sterk concept.', name: 'Ismail', role: 'verzamelaar van nicheparfum' },
  { quote: 'Je ruikt dat hier echt over balans is nagedacht. Elegant, zacht en toch aanwezig.', name: 'Lotte', role: 'parfumliefhebber' },
]

const faqs = [
  { question: 'Hoe ontwikkelt FERDIEK zich op de huid?', answer: 'FERDIEK opent helder en verfijnd, zakt daarna dieper in de huid en eindigt warmer, zachter en intiemer.' },
  { question: 'Voor welk moment draag je deze geur het liefst?', answer: 'Hij voelt bijzonder sterk in de namiddag, avond en tijdens momenten waarop je rustig maar aanwezig wilt binnenkomen.' },
  { question: 'Is FERDIEK voor mannen of vrouwen?', answer: 'FERDIEK is bewust opgebouwd als uniseks signatuurgeur. De focus ligt op textuur, balans en presence, niet op traditionele labels.' },
  { question: 'Wat maakt FERDIEK een signatuurparfum?', answer: 'De combinatie van donkere roos, frisse opening en warme dry-down geeft de geur een eigen karakter dat herkenbaar blijft zonder zwaar te worden.' },
]

function App({ homePageSeo = null }: { homePageSeo?: ApiSitePageSeoRecord | null }) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterName, setNewsletterName] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [heroImageReady, setHeroImageReady] = useState(false)

  const home = useMemo(() => resolveHomeContent(homePageSeo), [homePageSeo])
  const heroDesktopImage = resolveHomeHeroDesktop(homePageSeo)
  const heroMobileImage = resolveHomeHeroMobile(homePageSeo)
  const heroFocusPosition = mediaObjectPosition(homePageSeo?.seo.heroFocalX, homePageSeo?.seo.heroFocalY)

  useRevealOnScroll(
    '.reveal-up, .reveal-delay-1, .reveal-delay-2, .reveal-group, .reveal-left, .reveal-right, .fd-collection-card, .fd-philosophy-copy, .fd-philosophy-visual',
  )

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    setHeroImageReady(false)
  }, [heroDesktopImage, heroMobileImage])

  useEffect(() => {
    const heroImage = document.querySelector<HTMLImageElement>('.fd-hero-bg-img')
    if (heroImage?.complete && heroImage.naturalWidth > 0) {
      setHeroImageReady(true)
    }
  }, [heroDesktopImage, heroMobileImage])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterStatus('loading')
    try {
      await apiNewsletterSubscribe(newsletterEmail, newsletterName || undefined)
      setNewsletterStatus('success')
      setNewsletterEmail('')
      setNewsletterName('')
    } catch {
      setNewsletterStatus('error')
    }
  }

  return (
    <div id="top">
        <section id="product" className={`fd-hero-luxury${heroImageReady ? ' is-ready' : ''}`}>
          <picture className="fd-hero-bg" aria-hidden="true">
            <source srcSet={heroMobileImage} media="(max-width: 780px)" type="image/webp" />
            <img
              src={heroDesktopImage}
              alt=""
              className="fd-hero-bg-img"
              style={{ objectPosition: heroFocusPosition }}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              onLoad={() => setHeroImageReady(true)}
            />
          </picture>
          <div className="fd-hero-top">
            <h1 className="fd-hero-wordmark">{home.heroTitle}</h1>
            <p className="fd-hero-tagline">{home.heroTagline}</p>
          </div>
          <div className="fd-hero-cta-row">
            <button type="button" className="btn-sq btn-sq-light" onClick={() => document.getElementById('collectie')?.scrollIntoView({ behavior: 'smooth' })}>
              {home.heroCtaPrimary}
            </button>
            <Link to="/shop" className="btn-sq btn-sq-light">
              {home.heroCtaSecondary}
            </Link>
          </div>
        </section>

        <section className="section fd-feature-trio-section" aria-label="FERDIEK sfeerbeelden">
          <div className="fd-feature-trio-copy">
            <p className="eyebrow">{home.featureEyebrow}</p>
            <h2>{home.featureTitle}</h2>
            <p>{home.featureBody}</p>
            <Link to="/shop" className="btn-sq btn-sq-dark">{home.featureCta}</Link>
          </div>
          <div className="fd-feature-trio-cards">
            {home.featureCards.map((card) => (
              <figure key={card.title} className="fd-feature-trio-card">
                <img src={card.image} alt={card.title} loading="lazy" />
                <figcaption>
                  <span>{card.title}</span>
                  <strong>{card.copy}</strong>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <hr className="fd-divider" />

        <section className="section fd-collection" id="collectie">
          <p className="fd-collection-eyebrow">{home.collectionEyebrow}</p>
          <h2 className="fd-collection-heading">{home.collectionTitle}</h2>
          <p className="fd-collection-sub">{home.collectionSubtitle}</p>
          <div className="fd-collection-grid">
            {home.collectionItems.map((item) => (
              <div key={item.slug} className="fd-collection-card">
                <div className="fd-collection-card-media">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <h3 className="fd-collection-card-name">{item.name}</h3>
                <Link to={`/shop/${item.slug}`} className="btn-sq btn-sq-dark fd-collection-card-cta">
                  Discover
                </Link>
              </div>
            ))}
          </div>
        </section>

        <hr className="fd-divider" />

        <section className="section story-split story-split-clean" id="story">
          <div className="story-copy reveal-left">
            <p className="eyebrow">{home.storyEyebrow}</p>
            <h2>{home.storyTitle}</h2>
            {home.storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section id="notes" className="section section-notes">
          <div className="section-heading reveal-up">
            <p className="eyebrow">Geurnoten</p>
            <h2>Vier bouwstenen die samen een warme en moderne signatuur vormen.</h2>
          </div>
          <div className="notes-grid">
            {notes.map((note, index) => (
              <article key={note.name} className={`note-card reveal-up note-card-elegant ${index === 0 ? 'is-active' : ''}`}>
                <div className="note-card-head">
                  <div className="note-card-meta">
                    <span className="card-index">{note.number}</span>
                    <span className="note-card-accent" />
                  </div>
                  <div className={`availability-badge note-card-availability availability-${note.availabilityTone}`}>
                    <span className={`availability-orb availability-orb-${note.availabilityTone}`} />
                    <span>{note.availability}</span>
                  </div>
                </div>
                <h3>{note.name}</h3>
                <p>{note.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <hr className="fd-divider" />

        <section className="section fd-philosophy" id="philosophy">
          <div className="fd-philosophy-copy reveal-left">
            <p className="fd-philosophy-eyebrow">{home.philosophyEyebrow}</p>
            <h2 className="fd-philosophy-heading">{home.philosophyTitle}</h2>
            <p className="fd-philosophy-body">{home.philosophyBody}</p>
            <Link to="/atelier" className="btn-sq btn-sq-dark">{home.philosophyCta}</Link>
          </div>
          <div className="fd-philosophy-visual reveal-right">
            <div className="fd-philosophy-visual-inner">
              <img src={home.philosophyImage} alt="FERDIEK filosofie" />
            </div>
          </div>
        </section>

        <hr className="fd-divider" />

        <section id="stories" className="section section-testimonials">
          <div className="section-heading reveal-up">
            <p className="eyebrow">Reviews</p>
            <h2>Wat mensen voelen zodra FERDIEK zich opent op de huid.</h2>
          </div>
          <div className="testimonial-grid reveal-group review-burst">
            {testimonials.map((t) => (
              <article key={`${t.name}-${t.role}`} className="testimonial-card">
                <p className="testimonial-quote">"{t.quote}"</p>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="section fd-faq">
          <div className="fd-faq-shell">
            <header className="fd-faq-header reveal-up">
              <p className="fd-faq-eyebrow">Veelgestelde vragen</p>
              <h2 className="fd-faq-heading">Duidelijke antwoorden over karakter, draagmoment en signatuur.</h2>
              <p className="fd-faq-intro">
                Alles wat je wilt weten over hoe FERDIEK op de huid leeft — compact, helder en zonder jargon.
              </p>
            </header>
            <FaqAccordion items={faqs} defaultOpen={0} animateOnScroll />
            <div className="fd-faq-footer reveal-up">
              <Link to="/faq" className="btn-sq btn-sq-dark">
                Bekijk alle vragen
              </Link>
            </div>
          </div>
        </section>

        <hr className="fd-divider" />

        <section id="nieuwsbrief" className="section fd-newsletter-section">
          <div className="fd-newsletter-inner">
            <div className="fd-newsletter-copy">
              <p className="fd-collection-eyebrow">Nieuwsbrief</p>
              <h2 className="fd-collection-heading">Op de hoogte blijven</h2>
              <p className="fd-collection-sub" style={{ margin: '0', textAlign: 'left', maxWidth: 400 }}>
                Schrijf je in voor nieuws over nieuwe geuren, beschikbaarheid en exclusieve aanbiedingen.
              </p>
            </div>
            <form className="fd-newsletter-form" onSubmit={handleNewsletterSubmit}>
              {newsletterStatus === 'success' ? (
                <div className="fd-newsletter-success">✓ Bedankt voor je inschrijving!</div>
              ) : (
                <>
                  <div className="fd-newsletter-fields">
                    <input type="text" placeholder="Jouw naam" value={newsletterName} onChange={(e) => setNewsletterName(e.target.value)} className="fd-newsletter-input" />
                    <input type="email" placeholder="jij@email.nl" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required className="fd-newsletter-input" />
                  </div>
                  {newsletterStatus === 'error' && <p className="fd-newsletter-error">Er ging iets mis. Probeer het opnieuw.</p>}
                  <button type="submit" className="btn-sq btn-sq-dark" disabled={newsletterStatus === 'loading'}>
                    {newsletterStatus === 'loading' ? 'Bezig...' : 'Inschrijven'}
                  </button>
                </>
              )}
            </form>
          </div>
        </section>

        <hr className="fd-divider" />

        <section id="contact" className="section fd-contact-section">
          <div className="fd-contact-layout">
            <div className="fd-contact-copy reveal-left">
              <p className="fd-philosophy-eyebrow">Contact</p>
              <h2 className="fd-philosophy-heading">Stel je vraag</h2>
              <p className="fd-philosophy-body">
                Heb je een vraag over FERDIEK, je bestelling of de geuren?
                Stuur ons een bericht en we reageren zo snel mogelijk.
              </p>
              <div className="fd-contact-info">
                <a href="mailto:atelier@ferdiek.com" className="fd-contact-link">atelier@ferdiek.com</a>
              </div>
            </div>
            <form className="fd-contact-form reveal-right" onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              window.location.href = `mailto:atelier@ferdiek.com?subject=${encodeURIComponent(String(data.get('subject') || 'Vraag'))}&body=${encodeURIComponent(String(data.get('message') || ''))}`
            }}>
              <div className="fd-contact-fields">
                <label className="fd-contact-field"><span>Naam</span><input name="name" placeholder="Jouw naam" required /></label>
                <label className="fd-contact-field"><span>E-mail</span><input name="email" type="email" placeholder="jij@email.nl" required /></label>
                <label className="fd-contact-field fd-contact-field-wide"><span>Onderwerp</span><input name="subject" placeholder="Bijv. vraag over levering" required /></label>
                <label className="fd-contact-field fd-contact-field-wide"><span>Bericht</span><textarea name="message" rows={5} placeholder="Schrijf hier je vraag..." required /></label>
              </div>
              <button type="submit" className="btn-sq btn-sq-dark">Verstuur bericht</button>
            </form>
          </div>
        </section>
    </div>
  )
}

export default App
