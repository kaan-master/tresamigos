import { useMemo } from "react";
import { Helmet } from "../components/Helmet";
import { InstagramSection } from "../components/InstagramSection";
import { ReviewsSection } from "../components/ReviewsSection";
import { SiteVideo } from "../components/SiteVideo";
import type { SiteContent } from "@tresamigos/types";
import { assetUrl, pageUrl } from "../lib/api";
import { productImageUrl } from "../lib/productImage";
import { pageSeo } from "../lib/seo";
import { useLanguage } from "../i18n/LanguageProvider";
import { googleMapsUrl } from "../lib/maps";
import { videoPosterUrl } from "../lib/videoPoster";

function buildMarqueeTags(tags: string[]) {
  const repeats = Math.max(4, Math.ceil(24 / Math.max(tags.length, 1)));
  return Array.from({ length: repeats }, () => tags).flat();
}

export function HomePage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
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
  const marqueeTags = useMemo(() => buildMarqueeTags(site.hero.tags), [site.hero.tags]);
  /** Feature-card: nieuwe brand-video i.p.v. eat-like-a-mexican.png */
  const storyFeatureVideo = "/assets/brand/streetfood-secret.mp4";
  const activeVideos = videos.filter((video) => video.active !== false).slice(0, 3);
  const sectionPoster = videos[0] ? videoPosterUrl(videos[0].src) : null;

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <main>
        <header className="hero hero-clean">
          <div className="shell hero-grid">
            <div className="hero-copy">
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
              {activeVideos.map((video, index) => (
                <article className="portrait-video-card" key={video.id}>
                  <SiteVideo
                    src={assetUrl(video.src)}
                    poster={assetUrl(videoPosterUrl(video.src))}
                    preload={index === 0 ? "metadata" : "none"}
                    bootCritical={index === 0}
                    bootDefer={index > 0}
                  />
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
          <div className="brand-strip-track">
            {[0, 1].map((group) => (
              <div className="brand-strip-group" key={group} aria-hidden={group === 1 ? true : undefined}>
                {marqueeTags.map((tag, index) => (
                  <span key={`${group}-${tag}-${index}`}>{tag}</span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="section video-section">
          {sectionPoster ? (
            <img
              className="video-section-bg"
              src={assetUrl(sectionPoster)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="shell video-showcase">
            <div className="video-copy">
              <h2 className="section-title">{t("home.videos.title")}</h2>
              <p className="lead">{t("home.videos.intro")}</p>
            </div>
            <div className="hero-card food-first">
              <img src={assetUrl(site.seo.image || "/assets/site/restaurant-interior.jpg")} alt="Tres Amigos restaurant interior" />
              <div className="image-caption">{t("home.videos.caption")}</div>
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
                <h2>{t("home.menu.title")}</h2>
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
                    {t("home.menu.cta")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection settings={site.reviews} />

        <InstagramSection settings={site.instagram} />

        <section className="section section-soft">
          <div className="shell">
            <div className="section-heading">
              <div>
                <h2 className="section-title">{t("home.locations.title")}</h2>
              </div>
              <p className="lead">{t("home.locations.intro")}</p>
            </div>
            <div className="location-preview" x-apple-data-detectors="false">
              {previewLocations.map((location) => {
                const mapsHref = googleMapsUrl(location.address);
                return (
                  <a
                    className="location-preview-link"
                    href={mapsHref}
                    key={location.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>{location.area}</strong>
                    <span>{location.address}</span>
                  </a>
                );
              })}
            </div>
            <div className="actions">
              <a className="btn primary" href="/order">
                {t("home.locations.allOrderLinks")}
              </a>
              <a className="btn alt" href="/locations">
                {t("home.locations.viewLocations")}
              </a>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell feature-grid">
            <article className="feature-card">
              <h2>{site.ourStory.title}</h2>
              <p>{site.ourStory.intro}</p>
              <a className="text-link" href="/our-story">
                {t("home.story.readMore")}
              </a>
            </article>
            <article className="feature-card image-card">
              <SiteVideo
                poster={assetUrl(videoPosterUrl(storyFeatureVideo))}
                preload="none"
                bootDefer
                aria-label="Tres Amigos streetfood"
              >
                <source src={assetUrl(storyFeatureVideo)} media="(min-width: 921px)" />
              </SiteVideo>
            </article>
          </div>
        </section>

        <section className="section section-soft">
          <div className="shell">
            <div className="accent-card">
              <div className="accent-line" />
              <h2 className="section-title">{t("home.accent.title")}</h2>
              <p className="lead">{t("home.accent.intro")}</p>
              <div className="actions">
                <a className="btn primary" href="/menu">
                  {t("home.accent.menu")}
                </a>
                <a className="btn alt" href="/contact">
                  {t("home.accent.contact")}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
