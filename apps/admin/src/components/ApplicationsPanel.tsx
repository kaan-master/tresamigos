import type { Application, SiteContent, VacancyJob } from "@tresamigos/types";
import { MediaField } from "./MediaPickerModal";

interface Props {
  content: SiteContent;
  applications: Application[];
  onChange: (content: SiteContent) => void;
}

function updateVacancy(content: SiteContent, patch: Partial<SiteContent["site"]["vacancy"]>) {
  return {
    ...content,
    site: {
      ...content.site,
      vacancy: {
        ...content.site.vacancy,
        ...patch
      }
    }
  };
}

function updateJob(content: SiteContent, index: number, next: VacancyJob) {
  const jobs = [...content.site.vacancy.jobs];
  jobs[index] = next;
  return updateVacancy(content, { jobs });
}

export function ApplicationsPanel({ content, applications, onChange }: Props) {
  const vacancy = content.site.vacancy;

  return (
    <div className="ta-stack-panel">
      <section className="ta-location-editor">
        <header className="ta-panel-head">
          <h2>Vacaturepagina</h2>
          <p>Hero, sollicitatiebeeld en functies met volledige teksten en afbeeldingen.</p>
        </header>

        <div className="ta-grid">
          <label className="ta-field">
            <span>Hero titel</span>
            <input value={vacancy.heroTitle} onChange={(event) => onChange(updateVacancy(content, { heroTitle: event.target.value }))} />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Hero intro</span>
            <textarea value={vacancy.heroIntro} rows={3} onChange={(event) => onChange(updateVacancy(content, { heroIntro: event.target.value }))} />
          </label>
          <MediaField
            label="Hero afbeelding"
            value={vacancy.heroImage}
            onChange={(value) => onChange(updateVacancy(content, { heroImage: value }))}
          />
          <MediaField
            label="Sollicitatieformulier afbeelding"
            value={vacancy.formImage}
            onChange={(value) => onChange(updateVacancy(content, { formImage: value }))}
          />
        </div>
      </section>

      <section className="ta-location-editor">
        <header className="ta-panel-head">
          <h2>Functies</h2>
          <p>Elke functie verschijnt als kaart op Work With Us met requirements en full description.</p>
        </header>

        <div className="ta-product-list">
          {vacancy.jobs.map((job, index) => (
            <article className="ta-product-row" key={job.id}>
              <div className="ta-toolbar ta-toolbar-spread">
                <label className="ta-toggle">
                  <input
                    type="checkbox"
                    checked={job.enabled}
                    onChange={(event) => updateJob(content, index, { ...job, enabled: event.target.checked })}
                  />
                  <span>{job.enabled ? "Actief" : "Verborgen"}</span>
                </label>
                <strong>{job.title}</strong>
              </div>

              <div className="ta-grid">
                <label className="ta-field">
                  <span>Functietitel</span>
                  <input value={job.title} onChange={(event) => updateJob(content, index, { ...job, title: event.target.value })} />
                </label>
                <label className="ta-field">
                  <span>Apply knop tekst</span>
                  <input value={job.applyLabel} onChange={(event) => updateJob(content, index, { ...job, applyLabel: event.target.value })} />
                </label>
                <MediaField label="Functie afbeelding" value={job.image} onChange={(value) => updateJob(content, index, { ...job, image: value })} />
                <label className="ta-field ta-grid-wide">
                  <span>Samenvatting</span>
                  <textarea value={job.summary} rows={3} onChange={(event) => updateJob(content, index, { ...job, summary: event.target.value })} />
                </label>
                <label className="ta-field ta-grid-wide">
                  <span>Requirements (1 per regel)</span>
                  <textarea
                    rows={4}
                    value={job.requirements.join("\n")}
                    onChange={(event) =>
                      updateJob(content, index, {
                        ...job,
                        requirements: event.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                      })
                    }
                  />
                </label>
                <label className="ta-field ta-grid-wide">
                  <span>Full description</span>
                  <textarea value={job.fullDescription} rows={5} onChange={(event) => updateJob(content, index, { ...job, fullDescription: event.target.value })} />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ta-location-editor">
        <header className="ta-panel-head">
          <h2>Inkomende aanvragen</h2>
          <p>{applications.length} sollicitaties ontvangen</p>
        </header>

        {applications.length ? (
          <div className="ta-product-list">
            {applications.map((application) => (
              <article className="ta-product-row" key={application.id}>
                <div className="ta-toolbar ta-toolbar-spread">
                  <div>
                    <strong>{application.name}</strong>
                    <p className="ta-seo-hint" style={{ marginTop: 4 }}>
                      {application.role} · {new Date(application.createdAt).toLocaleString("nl-NL")}
                    </p>
                  </div>
                  <span className="ta-status">{application.status}</span>
                </div>
                <div className="ta-grid">
                  <label className="ta-field">
                    <span>E-mail</span>
                    <input readOnly value={application.email} />
                  </label>
                  <label className="ta-field">
                    <span>Telefoon</span>
                    <input readOnly value={application.phone || "-"} />
                  </label>
                  <label className="ta-field ta-grid-wide">
                    <span>Dagen</span>
                    <input readOnly value={application.days.join(", ") || "-"} />
                  </label>
                </div>
                {application.pdf?.data ? (
                  <a className="ta-btn ta-btn-ghost" href={application.pdf.data} download={application.pdf.name}>
                    PDF downloaden
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="ta-empty">Nog geen sollicitatie-aanvragen gevonden.</div>
        )}
      </section>
    </div>
  );
}
