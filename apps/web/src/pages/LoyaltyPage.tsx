import { useState } from "react";
import type { SiteContent } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { useLanguage } from "../i18n/LanguageProvider";
import { pageSeo } from "../lib/seo";

const LEAT_URL = "https://bomies-fd-bv.app.leat.com";

const TIERS = [
  { id: "amigo", titleKey: "loyalty.tier1", descKey: "loyalty.tier1Desc" },
  { id: "hermano", titleKey: "loyalty.tier2", descKey: "loyalty.tier2Desc" },
  { id: "patron", titleKey: "loyalty.tier3", descKey: "loyalty.tier3Desc" }
] as const;

const FAQ = [
  { q: "loyalty.faq1Q", a: "loyalty.faq1A" },
  { q: "loyalty.faq2Q", a: "loyalty.faq2A" },
  { q: "loyalty.faq3Q", a: "loyalty.faq3A" }
] as const;

export function LoyaltyPage({ content }: { content: SiteContent }) {
  const { t } = useLanguage();
  const seo = pageSeo(content, "loyalty");
  const [activeTier, setActiveTier] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="loyalty-hero">
        <div className="shell loyalty-hero-inner">
          <div className="loyalty-hero-actions">
            <a className="btn alt" href={LEAT_URL} target="_blank" rel="noreferrer">
              {t("loyalty.login")}
            </a>
            <a className="btn primary" href={LEAT_URL} target="_blank" rel="noreferrer">
              {t("loyalty.signup")}
            </a>
          </div>
          <h1>{t("loyalty.heroTitle")}</h1>
          <p>{t("loyalty.heroIntro")}</p>
          <div className="loyalty-stats">
            <span>{t("loyalty.statWelcome")}</span>
            <span>{t("loyalty.statTiers")}</span>
            <span>{t("loyalty.statPrice")}</span>
          </div>
          <div className="actions">
            <a className="btn primary" href="#tiers">
              {t("loyalty.seeJourney")}
            </a>
            <a className="btn alt" href={LEAT_URL} target="_blank" rel="noreferrer">
              {t("loyalty.joinCta")}
            </a>
          </div>
        </div>
      </header>

      <nav className="loyalty-subnav" aria-label="Loyalty">
        <div className="shell loyalty-subnav-inner">
          <a href="#tiers">{t("loyalty.navJourney")}</a>
          <a href="#rewards">{t("loyalty.navRewards")}</a>
          <a href="#faq">{t("loyalty.navFaq")}</a>
          <a className="btn primary" href={LEAT_URL} target="_blank" rel="noreferrer">
            {t("loyalty.joinCta")}
          </a>
        </div>
      </nav>

      <section className="section" id="tiers">
        <div className="shell">
          <h2 className="section-title">{t("loyalty.tiersTitle")}</h2>
          <p className="lead">{t("loyalty.tiersIntro")}</p>
          <div className="loyalty-tier-tabs" role="tablist">
            {TIERS.map((tier, index) => (
              <button
                key={tier.id}
                type="button"
                role="tab"
                aria-selected={activeTier === index}
                className={activeTier === index ? "active" : ""}
                onClick={() => setActiveTier(index)}
              >
                {t(tier.titleKey)}
              </button>
            ))}
          </div>
          <article className="loyalty-tier-card">
            <h3>{t(TIERS[activeTier].titleKey)}</h3>
            <p>{t(TIERS[activeTier].descKey)}</p>
          </article>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <h2 className="section-title">{t("loyalty.howTitle")}</h2>
          <div className="loyalty-how-grid">
            <article>
              <strong>1</strong>
              <h3>{t("loyalty.how1Title")}</h3>
              <p>{t("loyalty.how1Text")}</p>
            </article>
            <article>
              <strong>2</strong>
              <h3>{t("loyalty.how2Title")}</h3>
              <p>{t("loyalty.how2Text")}</p>
            </article>
            <article>
              <strong>3</strong>
              <h3>{t("loyalty.how3Title")}</h3>
              <p>{t("loyalty.how3Text")}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="rewards">
        <div className="shell">
          <h2 className="section-title">{t("loyalty.rewardsTitle")}</h2>
          <p className="lead">{t("loyalty.rewardsIntro")}</p>
          <div className="loyalty-rewards-grid">
            <article>{t("loyalty.reward1")}</article>
            <article>{t("loyalty.reward2")}</article>
            <article>{t("loyalty.reward3")}</article>
            <article>{t("loyalty.reward4")}</article>
          </div>
        </div>
      </section>

      <section className="section section-soft" id="faq">
        <div className="shell">
          <h2 className="section-title">{t("loyalty.faqTitle")}</h2>
          <div className="loyalty-faq">
            {FAQ.map((item, index) => {
              const open = openFaq === index;
              return (
                <div className={`loyalty-faq-item${open ? " open" : ""}`} key={item.q}>
                  <button type="button" onClick={() => setOpenFaq(open ? null : index)}>
                    {t(item.q)}
                  </button>
                  {open ? <p>{t(item.a)}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="join">
        <div className="shell">
          <div className="accent-card loyalty-join">
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
        </div>
      </section>
    </>
  );
}
