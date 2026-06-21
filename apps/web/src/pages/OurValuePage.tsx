import { Helmet } from "../components/Helmet";
import { assetUrl } from "../lib/api";
import { pageSeo } from "../lib/seo";
import type { SiteContent } from "@tresamigos/types";

export function OurValuePage({ content }: { content: SiteContent }) {
  const seo = pageSeo(content, "ourValue");
  const value = content.site.ourValue;
  const heroImage = value.heroImage || "assets/brand/real-mexican.png";
  const sideImage = value.sideImage || "assets/brand/with-love.png";

  return (
    <>
      <Helmet title={seo.title} description={seo.description} noindex={seo.noindex} />
      <header
        className="story-hero"
        style={{ backgroundImage: `linear-gradient(180deg,rgba(19,12,5,.25),rgba(19,12,5,.72)),url(${assetUrl(heroImage)})` }}
      >
        <div className="shell story-hero-inner">
          <h1>{value.title}</h1>
          <p>{value.intro}</p>
        </div>
      </header>

      <main className="section story-page">
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
            <img src={assetUrl(sideImage)} alt="Tres Amigos values" loading="lazy" />
          </figure>
        </div>
      </main>
    </>
  );
}
