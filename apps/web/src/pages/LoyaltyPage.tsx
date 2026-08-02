import { useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { assetUrl } from "../lib/api";
import { pageSeo } from "../lib/seo";
import "./loyalty.css";

const LEAT_URL = "https://bomies-fd-bv.app.leat.com";
const EGG = "#F8E2BE";
const BROWN = "#4a2f06";

const TIER_DATA = [
  {
    num: 1,
    key: "AMIGO",
    sub: "The starting line — free for everyone",
    req: "100 points needed",
    mult: "1.25×",
    color: "#F34238",
    ink: EGG,
    perks: ["+25% points on every order", "Welcome gift: a free quesadilla", "A €5 welcome treat, on us"]
  },
  {
    num: 2,
    key: "HERMANO",
    sub: "Reached at 250 points",
    req: "250 points needed",
    mult: "1.50×",
    color: "#0056D7",
    ink: EGG,
    perks: ["+50% points on every order", "Welcome gift: free tacos", "A €10 welcome treat, on us"]
  },
  {
    num: 3,
    key: "PATRON",
    sub: "Reached at 500 points",
    req: "500 points needed",
    mult: "2×",
    color: "#FCB92A",
    ink: BROWN,
    perks: ["+100% points on every order", "Welcome gift: a free menu deal", "A €15 welcome treat, on us"]
  }
] as const;

const REWARDS = [
  { name: "Chicken Tacos", pts: "160 pts", imageHint: /taco/i },
  { name: "Chicken Quesadilla", pts: "95 pts", imageHint: /quesadilla/i },
  { name: "Jarritos", pts: "40 pts", imageHint: /jarrito|drink|agua/i },
  { name: "Chocolate Brownie", pts: "50 pts", imageHint: /brownie|dessert|churro/i },
  { name: "Churros With Chocolate", pts: "70 pts", imageHint: /churro/i },
  { name: "Menu Deal", pts: "270 pts", imageHint: /burrito|menu|deal/i }
] as const;

const FAQ_DATA = [
  {
    q: "How do I join el club?",
    a: "Download the Tres Amigos app, create an account and place your first order. Joining is free — and there's a welcome taco waiting for you straight away."
  },
  {
    q: "How do I earn points?",
    a: "You earn points on every eligible order, in-store or in the app. Scan your QR code at the counter and points land on your account automatically. The higher your tier, the faster they stack."
  },
  {
    q: "Do my points expire?",
    a: "Points are valid for one year from the day you earn them. Spend them on free food before then — no take-backs, no cash value."
  },
  {
    q: "How do the tiers work?",
    a: "Order more across the year and you climb from Amigo to Hermano to Patron. Each level earns more points per order and unlocks better perks."
  },
  {
    q: "Where can I use my rewards?",
    a: "At every Tres Amigos location in Amsterdam. Just open the app to show your wallet pass at the counter — the app even suggests the right reward for your order."
  }
] as const;

function useLoyaltyFonts() {
  useEffect(() => {
    const id = "loyalty-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Anton&family=Hanken+Grotesk:wght@500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function pickImages(content: SiteContent) {
  const items = content.menu.flatMap((category) => category.items);
  const images = items.map((item) => item.image).filter(Boolean) as string[];
  return {
    hero: images[0] || "",
    math: images[1] || images[0] || "",
    rewards: REWARDS.map((reward) => {
      const match = items.find(
        (item) => reward.imageHint.test(item.name || "") || reward.imageHint.test(item.id || "")
      );
      return match?.image || images[0] || "";
    })
  };
}

export function LoyaltyPage({ content }: { content: SiteContent }) {
  const seo = pageSeo(content, "loyalty");
  const [activeTier, setActiveTier] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  useLoyaltyFonts();

  const images = useMemo(() => pickImages(content), [content]);
  const active = TIER_DATA[activeTier];

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <div className="lj">
        {/* HERO */}
        <section className="lj-hero">
          <div className="lj-wrap lj-hero-grid">
            <div className="lj-hero-copy">
              <span className="lj-pill lj-pill-yellow">Tres Amigos Rewards</span>
              <h1>
                EAT TACOS.
                <br />
                <span className="lj-accent">EARN TACOS.</span>
                <br />
                REPEAT.
              </h1>
              <p>
                Every order earns points. Points become free food. The more you eat with us, the bigger the
                perks get — from a free taco today to Patron status.
              </p>
              <div className="lj-hero-actions">
                <a className="lj-btn lj-btn-blue" href={LEAT_URL} target="_blank" rel="noreferrer">
                  SIGN UP
                </a>
                <a className="lj-btn lj-btn-yellow" href={LEAT_URL} target="_blank" rel="noreferrer">
                  LOG IN
                </a>
                <a className="lj-btn lj-btn-ghost" href="#tiers">
                  SEE THE JOURNEY
                </a>
              </div>
              <div className="lj-stats">
                <div>
                  <strong>20</strong>
                  <span>Welcome points</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>Tiers to climb</span>
                </div>
                <div>
                  <strong>€0</strong>
                  <span>To join</span>
                </div>
              </div>
            </div>
            <div className="lj-hero-phone">
              <div className="lj-phone-bezel">
                {images.hero ? (
                  <img src={assetUrl(images.hero)} alt="" />
                ) : (
                  <div className="lj-slot" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* TIERS */}
        <section className="lj-tiers" id="tiers">
          <div className="lj-wrap">
            <div className="lj-center">
              <span className="lj-pill lj-pill-blue">The Journey</span>
              <h2>
                THREE TIERS.
                <br />
                ONE HUNGRY AMIGO.
              </h2>
              <p>
                Order more over the year and climb from Amigo to Patron. Every level stacks your points faster
                and unlocks tastier perks. <strong>Tap a tier</strong> to see what&apos;s inside.
              </p>
            </div>

            <div className="lj-tier-layout">
              <div className="lj-tier-tabs" role="tablist" aria-label="Loyalty tiers">
                {TIER_DATA.map((tier, index) => {
                  const selected = activeTier === index;
                  return (
                    <button
                      key={tier.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={`lj-tier-tab${selected ? " is-active" : ""}`}
                      style={
                        selected
                          ? {
                              background: tier.color,
                              color: tier.ink,
                              boxShadow: "6px 7px 0 #4a2f06"
                            }
                          : undefined
                      }
                      onClick={() => setActiveTier(index)}
                    >
                      <div className="lj-tier-tab-main">
                        <span className="lj-tier-num">0{tier.num}</span>
                        <div>
                          <strong>{tier.key}</strong>
                          <em>{tier.req}</em>
                        </div>
                      </div>
                      <span className="lj-tier-mult">{tier.mult}</span>
                    </button>
                  );
                })}
              </div>

              <article
                className="lj-tier-detail"
                style={{ background: active.color, color: active.ink }}
                aria-live="polite"
              >
                <div className="lj-tier-detail-head">
                  <div>
                    <span>Tier 0{active.num}</span>
                    <h3>{active.key}</h3>
                    <p>{active.sub}</p>
                  </div>
                  <div className="lj-tier-points">
                    <strong>{active.mult}</strong>
                    <span>points</span>
                  </div>
                </div>
                <div className="lj-tier-rule" />
                <ul>
                  {active.perks.map((perk) => (
                    <li key={perk}>
                      <span className="lj-diamond" aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* MATH */}
        <section className="lj-math">
          <div className="lj-wrap lj-math-grid">
            <div>
              <span className="lj-pill lj-pill-yellow">Let&apos;s do some quick math</span>
              <h2>
                YOUR NORMAL WEEK,
                <br />
                NOW WITH FREE QUESADILLA
              </h2>
              <p>
                Lunch on workdays. A burrito after the gym. Churros because, well, churros. Here&apos;s what two
                weeks quietly adds up to:
              </p>
              <div className="lj-math-row">
                <div className="lj-math-chip">
                  <strong>3×</strong>
                  <span>Lunch tacos</span>
                </div>
                <span className="lj-math-op">+</span>
                <div className="lj-math-chip">
                  <strong>1×</strong>
                  <span>Gym burrito</span>
                </div>
                <span className="lj-math-op">+</span>
                <div className="lj-math-chip">
                  <strong>1×</strong>
                  <span>Churros</span>
                </div>
                <span className="lj-math-op">=</span>
                <div className="lj-math-result">
                  <strong>1 FREE QUESADILLA</strong>
                  <span>On us</span>
                </div>
              </div>
              <p className="lj-math-note">
                The routine doesn&apos;t change. The free quesadilla just come around faster the higher you climb.{" "}
                <em>Patron earns +100% every order.</em>
              </p>
            </div>
            <div className="lj-math-photo">
              {images.math ? <img src={assetUrl(images.math)} alt="" /> : <div className="lj-slot" />}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section className="lj-how">
          <div className="lj-wrap">
            <h2>CÓMO FUNCIONA</h2>
            <p className="lj-how-sub">Three steps. That&apos;s the whole thing.</p>
            <div className="lj-how-grid">
              <article>
                <strong className="lj-how-uno">UNO</strong>
                <h3>DOWNLOAD &amp; JOIN</h3>
                <p>
                  Grab the app, make an account, and we&apos;ll drop 20 welcome points and a free drink in your
                  pocket.
                </p>
              </article>
              <article>
                <strong className="lj-how-dos">DOS</strong>
                <h3>ORDER &amp; EARN</h3>
                <p>Earn points on every order. Scan your QR at the counter — points land automatically.</p>
              </article>
              <article>
                <strong className="lj-how-tres">TRES</strong>
                <h3>REDEEM &amp; FEAST</h3>
                <p>
                  Spend points on free food and perks. The app nudges you the second a reward is within reach.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* REWARDS */}
        <section className="lj-rewards" id="rewards">
          <div className="lj-wrap">
            <div className="lj-rewards-head">
              <div>
                <span className="lj-pill lj-pill-red">Spend your points</span>
                <h2>THE GOOD STUFF</h2>
              </div>
              <p>
                A taste of what&apos;s waiting in the app. Rewards rotate, so keep your eyes peeled, amigo.
              </p>
            </div>
            <div className="lj-rewards-grid">
              {REWARDS.map((reward, index) => (
                <article key={reward.name}>
                  <div className="lj-reward-media">
                    {images.rewards[index] ? (
                      <img src={assetUrl(images.rewards[index])} alt="" />
                    ) : (
                      <div className="lj-slot" />
                    )}
                  </div>
                  <div className="lj-reward-foot">
                    <h3>{reward.name}</h3>
                    <span>{reward.pts}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lj-faq" id="faq">
          <div className="lj-wrap lj-faq-wrap">
            <h2>PREGUNTAS</h2>
            <p className="lj-faq-sub">The stuff everybody asks before joining.</p>
            <div className="lj-faq-list">
              {FAQ_DATA.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div className={`lj-faq-item${open ? " is-open" : ""}`} key={item.q}>
                    <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} aria-expanded={open}>
                      <span>{item.q}</span>
                      <em aria-hidden="true">{open ? "–" : "+"}</em>
                    </button>
                    {open ? <p>{item.a}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* JOIN */}
        <section className="lj-join" id="join">
          <div className="lj-wrap lj-join-inner">
            <h2>
              READY TO EAT
              <br />
              <span className="lj-accent">LIKE A MEXICAN?</span>
            </h2>
            <p>Join el club free, claim your welcome drink, and start the journey to Patron today.</p>
            <div className="lj-join-actions">
              <a className="lj-btn lj-btn-blue" href={LEAT_URL} target="_blank" rel="noreferrer">
                GET APPLE WALLET
              </a>
              <a className="lj-btn lj-btn-brown" href={LEAT_URL} target="_blank" rel="noreferrer">
                GET ANDROID WALLET
              </a>
            </div>
          </div>
        </section>

        <div className="lj-checker" aria-hidden="true" />
      </div>
    </>
  );
}
