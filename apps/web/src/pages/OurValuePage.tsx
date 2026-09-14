import { Helmet } from "../components/Helmet";
import { assetUrl } from "../lib/api";
import { pageMediaImgStyle, pageMediaObjectPosition, resolvePageMediaSrc } from "../lib/pageMedia";
import { pageSeo } from "../lib/seo";
import type { SiteContent } from "@tresamigos/types";

const VALUE_FALLBACKS = {
  hero: "/assets/site/our-value-hero.png",
  side: "/assets/site/home-hero.png",
  grid: ["/assets/site/loyalty-dining.jpg", "/assets/site/secretfoodspot.jpg", "/assets/site/grab-jaritos.jpg"] as const
};

export function OurValuePage({ content }: { content: SiteContent }) {
  const seo = pageSeo(content, "ourValue");
  const value = content.site.ourValue;
  const pageMedia = content.site.pageMedia.ourValue;
  const heroSrc = resolvePageMediaSrc(pageMedia.hero, value.heroImage || VALUE_FALLBACKS.hero);
  const sideSrc = resolvePageMediaSrc(pageMedia.side, value.sideImage || VALUE_FALLBACKS.side);
  const gridSlots = [
    { slot: pageMedia.grid1, fallback: VALUE_FALLBACKS.grid[0], hideMobile: true },
    { slot: pageMedia.grid2, fallback: VALUE_FALLBACKS.grid[1], hideMobile: true },
    { slot: pageMedia.grid3, fallback: VALUE_FALLBACKS.grid[2], hideMobile: false }
  ] as const;

  return (
    <>
      <Helmet title={seo.title} description={seo.description} noindex={seo.noindex} />
      <header
        className="story-hero value-hero"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(19,12,5,.28),rgba(19,12,5,.62)),url(${assetUrl(heroSrc)})`,
          backgroundPosition: pageMediaObjectPosition(pageMedia.hero)
        }}
      >
        <div className="shell story-hero-inner">
          <h1>{value.title}</h1>
          <p>{value.intro}</p>
        </div>
      </header>

      <section className="section value-atmosphere" aria-label="Sfeerbeelden">
        <div className="shell">
          <div className="value-atmosphere-grid">
            {gridSlots.map(({ slot, fallback, hideMobile }, index) => {
              const src = resolvePageMediaSrc(slot, fallback);
              return (
                <figure key={`grid-${index}`} className={hideMobile ? "value-atmosphere-hide-mobile" : undefined}>
                  <img src={assetUrl(src)} alt="" loading="lazy" style={pageMediaImgStyle(slot)} />
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      <main className="section story-page value-page">
        <div className="shell story-layout">
          <article className="story-content">
            {value.paragraphs.map((paragraph, index) => (
              <p className="story-paragraph" key={`${index}-${paragraph.slice(0, 24)}`}>
                {paragraph}
              </p>
            ))}
            <div className="story-schedule">{value.scheduleSummary}</div>
          </article>

          <figure className="story-visual">
            <img src={assetUrl(sideSrc)} alt="Tres Amigos values" loading="lazy" style={pageMediaImgStyle(pageMedia.side)} />
          </figure>
        </div>
      </main>
    </>
  );
}
