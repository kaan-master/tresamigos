import { useMemo, useState } from "react";
import type { SiteContent, VacancyJob } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { ApplicationWizardModal } from "../components/ApplicationWizardModal";
import { NewsletterInline } from "../components/NewsletterInline";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl } from "../lib/api";
import { pageMediaImgStyle, resolvePageMediaSrc } from "../lib/pageMedia";
import { pageSeo } from "../lib/seo";

const WORK_WITH_US_FALLBACK = "/assets/site/work-with-us-hero.png";
const BRAND_LOGO = "/assets/site/tres-amigos-logo-new.png";

type CategoryKey = "kitchen" | "leadership" | "operations";
type EmploymentKey = "fulltime" | "parttime";

export function VacancyPage({ content }: { content: SiteContent }) {
  const { t, lang } = useLanguage();
  const vacancy = content.site.vacancy;
  const seo = pageSeo(content, "vacancy");
  const heroSlot = content.site.pageMedia.vacancy.hero;
  const heroSrc = resolvePageMediaSrc(heroSlot, vacancy.heroImage || WORK_WITH_US_FALLBACK);
  const enabledJobs = useMemo(() => vacancy.jobs.filter((job) => job.enabled !== false), [vacancy.jobs]);

  const [query, setQuery] = useState("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<VacancyJob | null>(null);

  const filteredJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return enabledJobs;
    return enabledJobs.filter((job) => {
      const haystack = [job.title, job.summary, job.location, job.fullDescription].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [enabledJobs, query]);

  const hasSearch = Boolean(query.trim());

  function applyLabel(job: VacancyJob) {
    return lang === "en" ? job.applyLabel || t("vacancy.apply") : t("vacancy.apply");
  }

  function categoryLabel(key: string) {
    return t(`vacancy.category.${key}` as "vacancy.category.kitchen");
  }

  function employmentLabel(key: string) {
    return t(`vacancy.employment.${key}` as "vacancy.employment.fulltime");
  }

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head compact vacancy-hero">
        <div className="shell vacancy-hero-grid">
          <div>
            <p className="eyebrow">{t("vacancy.eyebrow")}</p>
            <h1>{vacancy.heroTitle}</h1>
            <p>{vacancy.heroIntro}</p>
          </div>
          <div className="vacancy-hero-photo">
            <img
              src={assetUrl(heroSrc)}
              alt={t("vacancy.teamAlt")}
              loading="eager"
              style={pageMediaImgStyle(heroSlot)}
            />
          </div>
        </div>
      </header>

      <main className="section vacancy-section">
        <div className="shell">
          <label className="vacancy-search vacancy-search-bar">
            <span>{t("vacancy.search")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("vacancy.searchPlaceholder")}
            />
          </label>

          <section className="vacancy-results">
            <div className="vacancy-results-head">
              <p>
                {t("vacancy.showing")
                  .replace("{count}", String(filteredJobs.length))
                  .replace("{total}", String(enabledJobs.length))}
              </p>
            </div>

            <div className="vacancy-jobs">
              {filteredJobs.length ? (
                filteredJobs.map((job) => (
                  <article className="vacancy-job-card" key={job.id}>
                    <div className="vacancy-job-photo">
                      <div className="vacancy-logo-frame">
                        <img src={assetUrl(BRAND_LOGO)} alt="Tres Amigos" loading="lazy" />
                      </div>
                    </div>
                    <div className="vacancy-job-copy">
                      <div className="vacancy-job-meta">
                        {job.location ? <span>{job.location}</span> : null}
                        {job.category ? <span>{categoryLabel(job.category as CategoryKey)}</span> : null}
                        {job.employmentType ? (
                          <span>{employmentLabel(job.employmentType as EmploymentKey)}</span>
                        ) : null}
                      </div>
                      <h2>{job.title}</h2>
                      <p>{job.summary}</p>
                      {job.requirements.length ? (
                        <div className="vacancy-job-requirements">
                          <h3>{t("vacancy.requirements")}</h3>
                          <ul>
                            {job.requirements.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {expandedJob === job.id ? (
                        <div className="vacancy-job-full">
                          <h3>{t("vacancy.fullDescription")}</h3>
                          <p>{job.fullDescription}</p>
                        </div>
                      ) : null}
                      <div className="vacancy-job-actions">
                        <button
                          className="btn alt vacancy-desc-btn"
                          type="button"
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        >
                          {expandedJob === job.id ? t("vacancy.hideDescription") : t("vacancy.fullDescription")}
                        </button>
                        <button className="btn primary" type="button" onClick={() => setApplyJob(job)}>
                          {applyLabel(job)}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="notice">{hasSearch ? t("vacancy.noMatch") : t("vacancy.noJobs")}</div>
              )}
            </div>
          </section>
        </div>
      </main>

      <NewsletterInline placement="page" id="nieuwsbrief-vacancy" />

      <ApplicationWizardModal
        open={Boolean(applyJob)}
        job={applyJob}
        formImage={BRAND_LOGO}
        onClose={() => setApplyJob(null)}
      />
    </>
  );
}
