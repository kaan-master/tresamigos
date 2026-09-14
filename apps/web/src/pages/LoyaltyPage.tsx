import { useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl } from "../lib/api";
import { pageMediaImgStyle, resolvePageMediaSrc } from "../lib/pageMedia";
import { pageSeo } from "../lib/seo";

const LEAT_URL = "https://bomies-fd-bv.app.leat.com";

/** Fallback sfeerbeelden — hero uit assets/Loyalty. */
const LOYALTY_FALLBACKS = {
  hero: "/assets/site/loyalty-hero.png",
  guests: "/assets/site/loyalty-cheers.jpg",
  dining: "/assets/site/loyalty-dining.jpg",
  cheers: "/assets/site/story-guest.jpg"
} as const;

const TIER_KEYS = ["1", "2", "3"] as const;
const HOW_KEYS = ["1", "2", "3"] as const;
const REWARD_KEYS = ["1", "2", "3", "4"] as const;
const FAQ_KEYS = ["1", "2", "3"] as const;

export function LoyaltyPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const seo = pageSeo(content, "loyalty");
  const [openFaq, setOpenFaq] = useState(0);
  const media = content.site.pageMedia.loyalty;
  const heroSrc = resolvePageMediaSrc(media.hero, LOYALTY_FALLBACKS.hero);
  const guestsSrc = resolvePageMediaSrc(media.guests, LOYALTY_FALLBACKS.guests);
  const diningSrc = resolvePageMediaSrc(media.dining, LOYALTY_FALLBACKS.dining);
  const cheersSrc = resolvePageMediaSrc(media.cheers, LOYALTY_FALLBACKS.cheers);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />

      <header className="loyalty-hero">
        <div className="shell loyalty-hero-grid">
          <div className="loyalty-hero-copy">
            <p className="loyalty-hero-eyebrow">{t("loyalty.joinCta")}</p>
            <h1>{t("loyalty.heroTitle")}</h1>
            <p className="loyalty-hero-lead">{t("loyalty.heroIntro")}</p>
            <div className="actions">
              <a className="btn primary" href={LEAT_URL} target="_blank" rel="noreferrer">
                {t("loyalty.signup")}
              </a>
              <a className="btn alt" href={LEAT_URL} target="_blank" rel="noreferrer">
                {t("loyalty.login")}
              </a>
              <a className="btn alt" href="#loyalty-journey">
                {t("loyalty.seeJourney")}
              </a>
            </div>
            <ul className="loyalty-stats">
              <li>{t("loyalty.statWelcome")}</li>
              <li>{t("loyalty.statTiers")}</li>
              <li>{t("loyalty.statPrice")}</li>
            </ul>
          </div>
          <figure className="loyalty-hero-media">
            <img src={assetUrl(heroSrc)} alt="" style={pageMediaImgStyle(media.hero)} />
          </figure>
        </div>
      </header>

      <section className="loyalty-panel section-soft" id="loyalty-journey">
        <div className="loyalty-panel-grid">
          <div className="loyalty-panel-copy">
            <div className="loyalty-section-head">
              <h2 className="section-title">{t("loyalty.tiersTitle")}</h2>
              <p className="lead">{t("loyalty.tiersIntro")}</p>
            </div>
            <ul className="loyalty-tier-list">
              {TIER_KEYS.map((key) => (
                <li key={key}>
                  <strong>{t(`loyalty.tier${key}`)}</strong>
                  <span>{t(`loyalty.tier${key}Desc`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <figure className="loyalty-panel-media">
            <img src={assetUrl(guestsSrc)} alt="" loading="lazy" style={pageMediaImgStyle(media.guests)} />
          </figure>
        </div>
      </section>

      <section className="section loyalty-how">
        <div className="shell loyalty-how-grid">
          <div>
            <div className="loyalty-section-head">
              <h2 className="section-title">{t("loyalty.howTitle")}</h2>
            </div>
            <ul className="loyalty-how-list">
              {HOW_KEYS.map((key) => (
                <li key={key}>
                  <strong>{t(`loyalty.how${key}Title`)}</strong>
                  <span>{t(`loyalty.how${key}Text`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <figure className="loyalty-how-photo">
            <img src={assetUrl(diningSrc)} alt="" loading="lazy" style={pageMediaImgStyle(media.dining)} />
          </figure>
        </div>
      </section>

      <section className="section section-soft" id="loyalty-rewards">
        <div className="shell loyalty-split loyalty-split-reverse">
          <div>
            <div className="loyalty-section-head">
              <h2 className="section-title">{t("loyalty.rewardsTitle")}</h2>
              <p className="lead">{t("loyalty.rewardsIntro")}</p>
            </div>
            <ul className="loyalty-reward-list">
              {REWARD_KEYS.map((key) => (
                <li key={key}>{t(`loyalty.reward${key}`)}</li>
              ))}
            </ul>
          </div>
          <figure className="loyalty-side-photo loyalty-rewards-photo">
            <img src={assetUrl(cheersSrc)} alt="" loading="lazy" style={pageMediaImgStyle(media.cheers)} />
          </figure>
        </div>
      </section>

      <section className="section" id="loyalty-faq">
        <div className="shell loyalty-faq">
          <div className="loyalty-section-head">
            <h2 className="section-title">{t("loyalty.faqTitle")}</h2>
          </div>
          <div className="loyalty-faq-list">
            {FAQ_KEYS.map((key, index) => {
              const open = openFaq === index;
              return (
                <div className={`loyalty-faq-item${open ? " is-open" : ""}`} key={key}>
                  <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} aria-expanded={open}>
                    <span>{t(`loyalty.faq${key}Q`)}</span>
                    <em aria-hidden="true">{open ? "–" : "+"}</em>
                  </button>
                  {open ? <p>{t(`loyalty.faq${key}A`)}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-soft loyalty-join">
        <div className="shell loyalty-join-inner">
          <h2 className="section-title">{t("loyalty.joinTitle")}</h2>
          <p className="lead">{t("loyalty.joinIntro")}</p>
          <div className="actions">
            <a className="btn primary" href={LEAT_URL} target="_blank" rel="noreferrer">
              {t("loyalty.signup")}
            </a>
            <a className="btn alt" href={LEAT_URL} target="_blank" rel="noreferrer">
              {t("loyalty.login")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
