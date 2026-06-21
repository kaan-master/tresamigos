import { useMemo, useState } from "react";
import type { Application, SiteContent, VacancyJob } from "@tresamigos/types";
import { AdminFilterChips, AdminListRow, AdminSearchBar } from "./AdminListUi";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { MediaField } from "./MediaPickerModal";
import { createSlugId } from "../lib/id";
import { mediaAssetUrl } from "../lib/media";

interface Props extends PanelSaveProps {
  content: SiteContent;
  applications: Application[];
  onChange: (content: SiteContent) => void;
}

type PanelView = "incoming" | "jobs" | "page";

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

function roleLabel(content: SiteContent, roleId: string) {
  const job = content.site.vacancy.jobs.find((item) => item.id === roleId || item.title === roleId);
  return job?.title || roleId;
}

function emptyJob(): VacancyJob {
  const title = "Nieuwe functie";
  return {
    id: createSlugId(title, "job"),
    enabled: true,
    title,
    summary: "",
    requirements: [],
    fullDescription: "",
    applyLabel: "Solliciteer",
    image: "assets/site/restaurant-interior.jpg"
  };
}

function IncomingView({
  content,
  applications
}: {
  content: SiteContent;
  applications: Application[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [applications]
  );

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "Alle functies" },
      ...content.site.vacancy.jobs.map((job) => ({ value: job.id, label: job.title }))
    ],
    [content.site.vacancy.jobs]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return sorted.filter((application) => {
      if (roleFilter !== "all" && application.role !== roleFilter) return false;
      if (!normalized) return true;
      const haystack = [
        application.name,
        application.email,
        application.phone,
        roleLabel(content, application.role),
        application.status,
        application.days.join(" "),
        application.experience,
        application.motivation
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [sorted, query, roleFilter, content]);

  const selected =
    filtered.find((application) => application.id === selectedId) ||
    sorted.find((application) => application.id === selectedId) ||
    null;

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Zoek naam, e-mail, functie..."
          label="Sollicitaties zoeken"
        />
        <AdminFilterChips value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
        <p className="ta-seo-hint" style={{ margin: "0 0 10px" }}>
          {filtered.length} van {applications.length} sollicitaties
        </p>
        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((application) => (
              <AdminListRow
                key={application.id}
                title={application.name}
                meta={`${roleLabel(content, application.role)} · ${new Date(application.createdAt).toLocaleString("nl-NL")}`}
                badge={application.status}
                active={application.id === selectedId}
                onClick={() => setSelectedId(application.id)}
              />
            ))
          ) : (
            <div className="ta-empty">{applications.length ? "Geen resultaten." : "Nog geen sollicitaties ontvangen."}</div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="ta-detail-pane ta-fade-in" key={selected.id}>
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">{selected.name}</h3>
            <span className="ta-status">{selected.status}</span>
          </div>

          <div className="ta-grid">
            <label className="ta-field">
              <span>Functie</span>
              <input readOnly value={roleLabel(content, selected.role)} />
            </label>
            <label className="ta-field">
              <span>Datum</span>
              <input readOnly value={new Date(selected.createdAt).toLocaleString("nl-NL")} />
            </label>
            <label className="ta-field">
              <span>E-mail</span>
              <input readOnly value={selected.email} />
            </label>
            <label className="ta-field">
              <span>Telefoon</span>
              <input readOnly value={selected.phone || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Beschikbare dagen</span>
              <input readOnly value={selected.days.join(", ") || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Opmerking beschikbaarheid</span>
              <textarea readOnly rows={3} value={selected.availabilityNote || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Ervaring</span>
              <textarea readOnly rows={5} value={selected.experience || "-"} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Motivatie</span>
              <textarea readOnly rows={5} value={selected.motivation || "-"} />
            </label>
          </div>

          {selected.pdf?.data ? (
            <a className="ta-btn ta-btn-primary" href={selected.pdf.data} download={selected.pdf.name} style={{ marginTop: 12 }}>
              Bijlage downloaden ({selected.pdf.name})
            </a>
          ) : (
            <p className="ta-seo-hint" style={{ marginTop: 12 }}>
              Geen bijlage meegestuurd.
            </p>
          )}
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">Selecteer een sollicitatie om details te bekijken.</div>
      )}
    </div>
  );
}

function JobsView({
  content,
  onChange,
  onSave,
  saving
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
} & PanelSaveProps) {
  const vacancy = content.site.vacancy;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(vacancy.jobs[0]?.id || null);

  const selectedIndex = vacancy.jobs.findIndex((job) => job.id === selectedId);
  const job = selectedIndex >= 0 ? vacancy.jobs[selectedIndex] : null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vacancy.jobs;
    return vacancy.jobs.filter((item) =>
      `${item.title} ${item.summary} ${item.id}`.toLowerCase().includes(normalized)
    );
  }, [vacancy.jobs, query]);

  function setJobs(jobs: VacancyJob[]) {
    onChange(updateVacancy(content, { jobs }));
  }

  function updateJob(next: VacancyJob) {
    const jobs = [...vacancy.jobs];
    jobs[selectedIndex] = next;
    setJobs(jobs);
  }

  function addJob() {
    const next = emptyJob();
    setJobs([...vacancy.jobs, next]);
    setSelectedId(next.id);
  }

  function removeJob() {
    if (!job) return;
    const jobs = vacancy.jobs.filter((item) => item.id !== job.id);
    setJobs(jobs);
    setSelectedId(jobs[0]?.id || null);
  }

  return (
    <div className="ta-master-detail">
      <div className="ta-list-pane">
        <AdminSearchBar value={query} onChange={setQuery} placeholder="Zoek functietitel..." label="Functies zoeken" />
        <div className="ta-toolbar">
          <button className="ta-btn ta-btn-primary" type="button" onClick={addJob}>
            + Functie
          </button>
        </div>
        <div className="ta-list-scroll">
          {filtered.length ? (
            filtered.map((item) => (
              <AdminListRow
                key={item.id}
                title={item.title}
                meta={item.id}
                badge={item.enabled ? "Actief" : "Verborgen"}
                thumb={item.image ? mediaAssetUrl(item.image) : undefined}
                active={item.id === selectedId}
                onClick={() => setSelectedId(item.id)}
              />
            ))
          ) : (
            <div className="ta-empty">Geen functies gevonden.</div>
          )}
        </div>
      </div>

      {job ? (
        <div className="ta-detail-pane ta-fade-in" key={job.id}>
          <div className="ta-toolbar ta-toolbar-spread">
            <h3 className="ta-section-title">Functie bewerken</h3>
            <button className="ta-btn ta-btn-danger" type="button" onClick={removeJob}>
              Verwijderen
            </button>
          </div>

          <label className="ta-toggle">
            <input type="checkbox" checked={job.enabled} onChange={(event) => updateJob({ ...job, enabled: event.target.checked })} />
            <span>Actief op vacaturepagina</span>
          </label>

          <div className="ta-grid">
            <label className="ta-field">
              <span>Functietitel</span>
              <input value={job.title} onChange={(event) => updateJob({ ...job, title: event.target.value })} />
            </label>
            <label className="ta-field">
              <span>Apply knop tekst</span>
              <input value={job.applyLabel} onChange={(event) => updateJob({ ...job, applyLabel: event.target.value })} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Interne ID (voor sollicitaties)</span>
              <input readOnly value={job.id} />
            </label>
            <MediaField label="Functie afbeelding" value={job.image} onChange={(value) => updateJob({ ...job, image: value })} />
            <label className="ta-field ta-grid-wide">
              <span>Samenvatting</span>
              <textarea value={job.summary} rows={3} onChange={(event) => updateJob({ ...job, summary: event.target.value })} />
            </label>
            <label className="ta-field ta-grid-wide">
              <span>Requirements (1 per regel)</span>
              <textarea
                rows={4}
                value={job.requirements.join("\n")}
                onChange={(event) =>
                  updateJob({
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
              <span>Volledige omschrijving</span>
              <textarea value={job.fullDescription} rows={6} onChange={(event) => updateJob({ ...job, fullDescription: event.target.value })} />
            </label>
          </div>
          <FormSaveBar onSave={onSave} saving={saving} />
        </div>
      ) : (
        <div className="ta-detail-pane ta-empty">Selecteer een functie of voeg een nieuwe toe.</div>
      )}
    </div>
  );
}

function PageView({
  content,
  onChange,
  onSave,
  saving
}: {
  content: SiteContent;
  onChange: (content: SiteContent) => void;
} & PanelSaveProps) {
  const vacancy = content.site.vacancy;

  return (
    <div className="ta-detail-pane ta-fade-in" style={{ maxWidth: 920 }}>
      <h3 className="ta-section-title">Vacaturepagina</h3>
      <p className="ta-seo-hint">Hero en sollicitatiebeeld op Work With Us.</p>
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
      <FormSaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

export function ApplicationsPanel({ content, applications, onChange, onSave, saving }: Props) {
  const [view, setView] = useState<PanelView>("incoming");

  const viewOptions = useMemo(
    () => [
      { value: "incoming", label: `Inkomend (${applications.length})` },
      { value: "jobs", label: `Functies (${content.site.vacancy.jobs.length})` },
      { value: "page", label: "Pagina" }
    ],
    [applications.length, content.site.vacancy.jobs.length]
  );

  return (
    <div className="ta-stack-panel">
      <AdminFilterChips value={view} onChange={(value) => setView(value as PanelView)} options={viewOptions} />

      {view === "incoming" ? <IncomingView content={content} applications={applications} /> : null}
      {view === "jobs" ? <JobsView content={content} onChange={onChange} onSave={onSave} saving={saving} /> : null}
      {view === "page" ? <PageView content={content} onChange={onChange} onSave={onSave} saving={saving} /> : null}
    </div>
  );
}
