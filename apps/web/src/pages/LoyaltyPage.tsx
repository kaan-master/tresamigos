import { useMemo, useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl } from "../lib/api";
import { pageSeo } from "../lib/seo";

const LEAT_URL = "https://bomies-fd-bv.app.leat.com";

const TIER_KEYS = ["1", "2", "3"] as const;
const HOW_KEYS = ["1", "2", "3"] as const;
const REWARD_KEYS = ["1", "2", "3", "4"] as const;
const FAQ_KEYS = ["1", "2", "3"] as const;

function pickHeroImage(content: SiteContent) {
  const items = content.menu.flatMap((category) => category.items);
  return items.map((item) => item.image).find(Boolean) || "/assets/site/quesadilla-drinks.webp";
}

export function LoyaltyPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const seo = pageSeo(content, "loyalty");
  const [openFaq, setOpenFaq] = useState(0);
  const heroImage = useMemo(() => pickHeroImage(content), [content]);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />

      <header className="page-head">
        <div className="shell">
          <p className="eyebrow">{t("loyalty.joinCta")}</p>
          <h1>{t("loyalty.heroTitle")}</h1>
          <p>{t("loyalty.heroIntro")}</p>
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
      </header>

      <section className="section loyalty-visual">
        <div className="shell">
          <figure className="loyalty-visual-frame">
            <img src={assetUrl(heroImage)} alt="" loading="lazy" />
          </figure>
        </div>
      </section>

      <section className="section section-soft" id="loyalty-journey">
        <div className="shell">
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
      </section>

      <section className="section">
        <div className="shell">
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
      </section>

      <section className="section section-soft" id="loyalty-rewards">
        <div className="shell">
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
