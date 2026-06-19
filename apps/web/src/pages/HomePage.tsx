import { Helmet } from "../components/Helmet";
import { ReviewsSection } from "../components/ReviewsSection";
import type { SiteContent } from "@tresamigos/types";
import { assetUrl, pageUrl } from "../lib/api";
import { productImageUrl } from "../lib/productImage";
import { pageSeo } from "../lib/seo";

export function HomePage({ content }: { content: SiteContent }) {
  const { site, videos, menu, locations } = content;
  const seo = pageSeo(content, "home");
  const featuredItems = menu
    .flatMap((category) => category.items.filter((item) => item.active !== false))
    .filter((item) => item.featured)
    .slice(0, 4);
  const showcaseItems =
    featuredItems.length > 0
      ? featuredItems
      : menu.flatMap((category) => category.items.filter((item) => item.active !== false)).slice(0, 4);
  const previewLocations = locations.filter((location) => location.active !== false).slice(0, 4);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <main>
        <header className="hero hero-clean">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">{site.hero.eyebrow}</div>
              <h1>{site.hero.title}</h1>
              <p>{site.hero.intro}</p>
              <div className="actions">
                <a className="btn primary" href={pageUrl(site.hero.primaryUrl)}>
                  {site.hero.primaryLabel}
                </a>
                <a className="btn alt" href={pageUrl(site.hero.secondaryUrl)}>
                  {site.hero.secondaryLabel}
                </a>
              </div>
            </div>
            <div className="portrait-video-grid hero-video-grid">
              {videos
                .filter((video) => video.active !== false)
                .slice(0, 3)
                .map((video) => (
                  <article className="portrait-video-card" key={video.id}>
                    <video src={assetUrl(video.src)} muted autoPlay loop playsInline preload="metadata" />
                    <div>
                      <h3>{video.title}</h3>
                      <p>{video.caption}</p>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </header>

        <div className="brand-strip">
          <div>
            {[...site.hero.tags, ...site.hero.tags].map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
        </div>

        <section className="section video-section">
          {videos[0] ? (
            <video
              className="video-section-bg"
              src={assetUrl(videos[0].src)}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          ) : null}
          <div className="shell video-showcase">
            <div className="video-copy">
              <span className="mini-label">{site.videosSection.eyebrow}</span>
              <h2 className="section-title">{site.videosSection.title}</h2>
              <p className="lead">{site.videosSection.intro}</p>
            </div>
            <div className="hero-card food-first">
              <img src={assetUrl(site.seo.image || "/assets/site/restaurant-interior.jpg")} alt="Tres Amigos restaurant interior" />
              <div className="image-caption">Four locations in Amsterdam</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div className="menu-showcase">
              <div className="showcase-photo">
                <img src={assetUrl("/assets/site/quesadilla-drinks.webp")} alt="Tres Amigos quesadillas and drinks" />
              </div>
              <div className="showcase-panel">
                <span className="mini-label">Popular choices</span>
                <h2>Menu that stays easy to scan.</h2>
                <div className="compact-menu-list">
                  {showcaseItems.map((item) => (
                    <article className="compact-menu-item" key={item.id}>
                      <img src={productImageUrl(item.image)} alt={item.name} loading="lazy" />
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                      </div>
                      <strong>{item.price}</strong>
                    </article>
                  ))}
                </div>
                <div className="actions">
                  <a className="btn primary" href="/menu">
                    View full menu
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection settings={site.reviews} />

        <section className="section section-soft">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="mini-label">Order flow</span>
                <h2 className="section-title">Choose your spot.</h2>
              </div>
              <p className="lead">
                A clear location overview with every correct order link per shop. No searching, no wrong platform, just pick the closest Tres Amigos.
              </p>
            </div>
            <div className="location-preview">
              {previewLocations.map((location) => (
                <div key={location.id}>
                  <strong>{location.area}</strong>
                  <span>{location.address}</span>
                </div>
              ))}
            </div>
            <div className="actions">
              <a className="btn primary" href="/order">
                All order links
              </a>
              <a className="btn alt" href="/locations">
                View locations
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell feature-grid">
            <article className="feature-card">
              <span className="mini-label">Our story</span>
              <h2>{site.ourStory.title}</h2>
              <p>{site.ourStory.intro}</p>
              <a className="text-link" href="/our-story">
                Read the story
              </a>
            </article>
            <article className="feature-card image-card">
              <img src={assetUrl("/assets/brand/eat-like-a-mexican.png")} alt="Tres Amigos Eat like a Mexican brand artwork" />
            </article>
          </div>
        </section>

        <section className="section section-soft">
          <div className="shell">
            <div className="accent-card">
              <div className="accent-line" />
              <h2 className="section-title">Real Mexican street food by real Mexicans.</h2>
              <p className="lead">
                A modern fast casual website with the Tres Amigos identity in the right dose: recognisable, but still sharp, clean and easy to use.
              </p>
              <div className="actions">
                <a className="btn primary" href="/menu">
                  Explore menu
                </a>
                <a className="btn alt" href="/contact">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
