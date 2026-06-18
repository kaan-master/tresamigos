import { Helmet } from "../components/Helmet";
import { assetUrl } from "../lib/api";

export function OurStoryPage() {
  return (
    <>
      <Helmet title="Our Story | Tres Amigos" description="Het verhaal achter Tres Amigos Amsterdam." />
      <header className="page-head compact">
        <div className="shell">
          <div className="eyebrow">Our story</div>
          <h1>Real Mexicans. Real street food.</h1>
          <p>Tres Amigos brings Mexican street food to Amsterdam with a clean, modern experience and four neighbourhood locations.</p>
        </div>
      </header>
      <main className="section">
        <div className="shell split">
          <article className="feature-card">
            <span className="mini-label">Brand story</span>
            <h2>Eat like a Mexican.</h2>
            <p>
              Tres Amigos started with a simple idea: serve real Mexican street food with fast service, fresh ingredients and a recognisable brand that still feels modern on the web.
            </p>
            <div className="palette">
              <span style={{ background: "#FCB92A" }}>Corn</span>
              <span style={{ background: "#F34238" }}>Cherry</span>
              <span style={{ background: "#0056D7" }}>Blue</span>
              <span style={{ background: "#593805", color: "#fff" }}>Mole</span>
              <span style={{ background: "#F8E2BE" }}>Egg</span>
            </div>
          </article>
          <article className="photo-block">
            <img src={assetUrl("/assets/brand/home-card.png")} alt="Tres Amigos brand card" />
          </article>
        </div>
      </main>
    </>
  );
}
