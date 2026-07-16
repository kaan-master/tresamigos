import { Helmet } from "../components/Helmet";
import { assetUrl } from "../lib/api";
import { isVideoSrc } from "../lib/isVideoSrc";
import { pageSeo } from "../lib/seo";
import type { SiteContent } from "@tresamigos/types";

export function OurStoryPage({ content }: { content: SiteContent }) {
  const seo = pageSeo(content, "ourStory");
  const story = content.site.ourStory;
  const heroImage = story.heroImage || "assets/site/restaurant-interior.jpg";
  const sideMedia =
    story.sideImage ||
    content.videos.find((video) => video.active !== false)?.src ||
    "assets/brand/best-in-amsterdam.mp4";
  const sideIsVideo = isVideoSrc(sideMedia);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header
        className="story-hero"
        style={{ backgroundImage: `linear-gradient(180deg,rgba(19,12,5,.25),rgba(19,12,5,.72)),url(${assetUrl(heroImage)})` }}
      >
        <div className="shell story-hero-inner">
          <h1>{story.title}</h1>
          <p>{story.intro}</p>
        </div>
      </header>

      <main className="section story-page">
        <div className="shell story-layout">
          <article className="story-content">
            {story.paragraphs.map((paragraph, index) => (
              <p className="story-paragraph" key={`${index}-${paragraph.slice(0, 24)}`}>
                {paragraph}
              </p>
            ))}
            <div className="story-schedule">{story.scheduleSummary}</div>
          </article>

          <figure className="story-visual">
            {sideIsVideo ? (
              <video
                src={assetUrl(sideMedia)}
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
                data-boot-critical="1"
                aria-label="Tres Amigos"
              />
            ) : (
              <img src={assetUrl(sideMedia)} alt="Tres Amigos" loading="lazy" />
            )}
          </figure>
        </div>
      </main>
    </>
  );
}
