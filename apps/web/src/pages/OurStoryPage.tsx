import { Helmet } from "../components/Helmet";
import { assetUrl } from "../lib/api";
import { pageSeo } from "../lib/seo";
import type { SiteContent } from "@tresamigos/types";

export function OurStoryPage({ content }: { content: SiteContent }) {
  const seo = pageSeo(content, "ourStory");
  const story = content.site.ourStory;
  const heroImage = story.heroImage || "assets/site/restaurant-interior.jpg";
  const sideImage = story.sideImage || "assets/brand/home-card.png";

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
            <img src={assetUrl(sideImage)} alt="Tres Amigos brand" loading="lazy" />
          </figure>
        </div>
      </main>
    </>
  );
}
