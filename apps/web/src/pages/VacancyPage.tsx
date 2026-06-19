import { useMemo, useState } from "react";
import type { SiteContent, VacancyJob } from "@tresamigos/types";
import { Helmet } from "../components/Helmet";
import { ApplicationWizardModal } from "../components/ApplicationWizardModal";
import { useLanguage } from "../i18n/LanguageProvider";
import { assetUrl } from "../lib/api";
import { pageSeo } from "../lib/seo";

export function VacancyPage({ content }: { content: SiteContent }) {
  const { t, lang } = useLanguage();
  const vacancy = content.site.vacancy;
  const seo = pageSeo(content, "vacancy");
  const enabledJobs = useMemo(() => vacancy.jobs.filter((job) => job.enabled !== false), [vacancy.jobs]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<VacancyJob | null>(null);

  function applyLabel(job: VacancyJob) {
    return lang === "en" ? job.applyLabel || t("vacancy.apply") : t("vacancy.apply");
  }

  return (
    <>
      <Helmet title={seo.title} description={seo.description} />
      <header className="page-head vacancy-hero">
        <div className="shell vacancy-hero-grid">
          <div>
            <div className="eyebrow">{t("vacancy.eyebrow")}</div>
            <h1>{vacancy.heroTitle}</h1>
            <p>{vacancy.heroIntro}</p>
          </div>
          <div className="vacancy-hero-photo">
            <img src={assetUrl(vacancy.heroImage)} alt={t("vacancy.teamAlt")} loading="lazy" />
          </div>
        </div>
      </header>

      <main className="section">
        <div className="shell">
          <section className="vacancy-jobs">
            {enabledJobs.length ? (
              enabledJobs.map((job) => (
                <article className="vacancy-job-card" key={job.id}>
                  <div className="vacancy-job-photo">
                    <img src={assetUrl(job.image)} alt={job.title} loading="lazy" />
                  </div>
                  <div className="vacancy-job-copy">
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
              <div className="notice">{t("vacancy.noJobs")}</div>
            )}
          </section>
        </div>
      </main>

      <ApplicationWizardModal
        open={Boolean(applyJob)}
        job={applyJob}
        formImage={vacancy.formImage}
        onClose={() => setApplyJob(null)}
      />
    </>
  );
}
