import { useEffect, useMemo, useState } from "react";
import type { Application, SiteContent, VacancyJob } from "@tresamigos/types";
import { FormSaveBar, type PanelSaveProps } from "./FormSaveBar";
import { MediaField } from "./MediaPickerModal";
import { IconApplications, IconList, IconPageMedia } from "./AdminIcons";
import { createSlugId } from "../lib/id";
import { mediaAssetUrl } from "../lib/media";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch, EntraShell, type EntraNavItem } from "./telling/entraUi";

interface Props extends PanelSaveProps {
  content: SiteContent;
  applications: Application[];
  onChange: (content: SiteContent) => void;
  initialView?: ApplicationsView | null;
  onViewChange?: (view: ApplicationsView) => void;
}

export type ApplicationsView = "incoming" | "jobs" | "page";

const NAV: Array<EntraNavItem<ApplicationsView>> = [
  { id: "incoming", label: "Inkomend", hint: "Sollicitaties filteren", Icon: IconApplications },
  { id: "jobs", label: "Functies", hint: "Vacatures beheren", Icon: IconList },
  { id: "page", label: "Tekst", hint: "Titel en intro", Icon: IconPageMedia }
];

const TITLES: Record<ApplicationsView, { title: string; subtitle: string }> = {
  incoming: { title: "Inkomend", subtitle: "Zoek en filter sollicitaties op functie, status en datum" },
  jobs: { title: "Functies", subtitle: "Vacatures die op de website verschijnen" },
  page: { title: "Paginatekst", subtitle: "Titel en intro. De foto wijzig je bij Website-instellingen → Pagina-foto's." }
};

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
    image: "assets/site/tres-amigos-logo-new.png",
    category: "operations",
    employmentType: "parttime",
    location: ""
  };
}

function normalizeRole(value: string) {
  return value.trim().toLowerCase();
}

function applicationMatchesJob(role: string, job: VacancyJob) {
  const key = normalizeRole(role);
  return key === normalizeRole(job.id) || key === normalizeRole(job.title);
}

function roleLabel(content: SiteContent, roleId: string) {
  const job = content.site.vacancy.jobs.find((item) => applicationMatchesJob(roleId, item));
  return job?.title || roleId;
}

function localDateKey(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statusLabel(status: string) {
  if (status === "nieuw") return "Nieuw";
  return status;
}

function IncomingView({
  content,
  applications
}: {
  content: SiteContent;
  applications: Application[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  const sorted = useMemo(
    () => [...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [applications]
  );

  const roleOptions = useMemo(() => {
    const jobs = content.site.vacancy.jobs;
    const options = jobs.map((job) => ({ value: job.id, label: job.title }));
    const known = new Set(jobs.flatMap((job) => [normalizeRole(job.id), normalizeRole(job.title)]));
    const orphans = [...new Set(sorted.map((item) => item.role).filter((role) => role && !known.has(normalizeRole(role))))];
    return [...options, ...orphans.map((role) => ({ value: role, label: role }))];
  }, [content.site.vacancy.jobs, sorted]);

  const statusOptions = useMemo(() => {
    const values = [...new Set(sorted.map((item) => item.status).filter(Boolean))];
    if (!values.includes("nieuw")) values.unshift("nieuw");
    return values;
  }, [sorted]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const jobs = content.site.vacancy.jobs;
    const selectedJob = jobs.find((job) => job.id === roleFilter) || jobs.find((job) => job.title === roleFilter) || null;

    return sorted.filter((application) => {
      if (roleFilter) {
        const matchesJob = selectedJob ? applicationMatchesJob(application.role, selectedJob) : false;
        const matchesRaw = normalizeRole(application.role) === normalizeRole(roleFilter);
        if (!matchesJob && !matchesRaw) return false;
      }
      if (statusFilter && application.status !== statusFilter) return false;
      const created = localDateKey(application.createdAt);
      if (dateFrom && created && created < dateFrom) return false;
      if (dateTo && created && created > dateTo) return false;
      if (!normalized) return true;
      const haystack = [
        application.name,
        application.email,
        application.phone,
        roleLabel(content, application.role),
        application.role,
        application.status,
        application.days.join(" "),
        application.experience,
        application.motivation
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [sorted, query, roleFilter, statusFilter, dateFrom, dateTo, content]);

  function resetFilters() {
    setQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={resetFilters}>Filters wissen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek op naam, e-mail of functie" />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">Alle functies</option>
          {roleOptions.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Alle statussen</option>
          {statusOptions.map((status) => (
            <option value={status} key={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        <span className="entra-count">
          {filtered.length} van {applications.length} sollicitaties
        </span>
      </div>

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Functie</th>
              <th>E-mail</th>
              <th>Telefoon</th>
              <th>Datum</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((application) => (
              <tr
                key={application.id}
                className={selected?.id === application.id ? "is-selected" : ""}
                onClick={() => setSelected(application)}
              >
                <td>
                  <button type="button" className="entra-link" onClick={() => setSelected(application)}>
                    {application.name}
                  </button>
                </td>
                <td>{roleLabel(content, application.role)}</td>
                <td>{application.email}</td>
                <td>{application.phone || "—"}</td>
                <td>{new Date(application.createdAt).toLocaleString("nl-NL")}</td>
                <td>
                  <span className={`entra-pill${application.status === "nieuw" ? " is-on" : ""}`}>
                    {statusLabel(application.status)}
                  </span>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={6} className="entra-empty">
                  {applications.length ? "Geen sollicitaties voor deze filters." : "Nog geen sollicitaties ontvangen."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <EntraBlade title={selected.name} onClose={() => setSelected(null)}>
          <p className="entra-meta">
            {roleLabel(content, selected.role)} · {new Date(selected.createdAt).toLocaleString("nl-NL")} ·{" "}
            {statusLabel(selected.status)}
          </p>
          <label>
            Functie
            <input readOnly value={roleLabel(content, selected.role)} />
          </label>
          <label>
            E-mail
            <input readOnly value={selected.email} />
          </label>
          <label>
            Telefoon
            <input readOnly value={selected.phone || "—"} />
          </label>
          <label>
            Beschikbare dagen
            <input readOnly value={selected.days.join(", ") || "—"} />
          </label>
          <label>
            Opmerking beschikbaarheid
            <textarea readOnly rows={3} value={selected.availabilityNote || "—"} />
          </label>
          <label>
            Ervaring
            <textarea readOnly rows={5} value={selected.experience || "—"} />
          </label>
          <label>
            Motivatie
            <textarea readOnly rows={5} value={selected.motivation || "—"} />
          </label>
          {selected.pdf?.data ? (
            <a className="ta-btn ta-btn-primary" href={selected.pdf.data} download={selected.pdf.name}>
              Bijlage downloaden ({selected.pdf.name})
            </a>
          ) : (
            <p className="entra-meta">Geen bijlage meegestuurd.</p>
          )}
        </EntraBlade>
      ) : null}
    </>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blade, setBlade] = useState<"edit" | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vacancy.jobs;
    return vacancy.jobs.filter((item) =>
      `${item.title} ${item.summary} ${item.id} ${item.location || ""}`.toLowerCase().includes(normalized)
    );
  }, [vacancy.jobs, query]);

  const selectedIndex = vacancy.jobs.findIndex((job) => job.id === selectedId);
  const job = selectedIndex >= 0 ? vacancy.jobs[selectedIndex] : null;

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
    setBlade("edit");
  }

  function removeJob() {
    if (!job) return;
    if (!window.confirm("Deze functie verwijderen?")) return;
    const jobs = vacancy.jobs.filter((item) => item.id !== job.id);
    setJobs(jobs);
    setSelectedId(jobs[0]?.id || null);
    setBlade(null);
  }

  function openJob(item: VacancyJob) {
    setSelectedId(item.id);
    setBlade("edit");
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={addJob}>Nieuwe functie</EntraCommand>
        <EntraCommand disabled={!job} onClick={() => job && setBlade("edit")}>
          Bewerken
        </EntraCommand>
        <EntraCommand danger disabled={!job} onClick={removeJob}>
          Verwijderen
        </EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek functietitel of locatie" />
        <span className="entra-count">
          {filtered.length} van {vacancy.jobs.length} functies
        </span>
      </div>

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Functie</th>
              <th>Locatie</th>
              <th>Dienstverband</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={item.id === selectedId ? "is-selected" : ""}
                onClick={() => openJob(item)}
              >
                <td>
                  {item.image ? (
                    <img className="entra-job-mini" src={mediaAssetUrl(item.image)} alt="" />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <button type="button" className="entra-link" onClick={() => openJob(item)}>
                    {item.title}
                  </button>
                </td>
                <td>{item.location || "—"}</td>
                <td>{item.employmentType === "fulltime" ? "Fulltime" : "Parttime"}</td>
                <td>
                  <span className={`entra-pill${item.enabled ? " is-on" : ""}`}>{item.enabled ? "Actief" : "Verborgen"}</span>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={5} className="entra-empty">
                  Geen functies gevonden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {blade === "edit" && job ? (
        <EntraBlade title={job.title} onClose={() => setBlade(null)}>
          <label className="ta-toggle">
            <input type="checkbox" checked={job.enabled} onChange={(event) => updateJob({ ...job, enabled: event.target.checked })} />
            <span>Actief op vacaturepagina</span>
          </label>
          <label>
            Functietitel
            <input value={job.title} onChange={(event) => updateJob({ ...job, title: event.target.value })} />
          </label>
          <label>
            Apply knop tekst
            <input value={job.applyLabel} onChange={(event) => updateJob({ ...job, applyLabel: event.target.value })} />
          </label>
          <label>
            Interne ID
            <input readOnly value={job.id} />
          </label>
          <MediaField label="Functie afbeelding" value={job.image} onChange={(value) => updateJob({ ...job, image: value })} />
          {job.image ? <img className="entra-job-thumb" src={mediaAssetUrl(job.image)} alt="" /> : null}
          <label>
            Categorie
            <select value={job.category || "operations"} onChange={(event) => updateJob({ ...job, category: event.target.value })}>
              <option value="kitchen">Keuken</option>
              <option value="leadership">Leiding</option>
              <option value="operations">Operatie</option>
            </select>
          </label>
          <label>
            Dienstverband
            <select
              value={job.employmentType || "fulltime"}
              onChange={(event) => updateJob({ ...job, employmentType: event.target.value })}
            >
              <option value="fulltime">Fulltime</option>
              <option value="parttime">Parttime</option>
            </select>
          </label>
          <label>
            Locatie
            <input
              value={job.location || ""}
              onChange={(event) => updateJob({ ...job, location: event.target.value })}
              placeholder="Amsterdam Oost"
            />
          </label>
          <label>
            Samenvatting
            <textarea value={job.summary} rows={3} onChange={(event) => updateJob({ ...job, summary: event.target.value })} />
          </label>
          <label>
            Requirements (1 per regel)
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
          <label>
            Volledige omschrijving
            <textarea value={job.fullDescription} rows={6} onChange={(event) => updateJob({ ...job, fullDescription: event.target.value })} />
          </label>
          <FormSaveBar onSave={onSave} saving={saving} />
        </EntraBlade>
      ) : null}
    </>
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
    <div className="entra-form">
      <div className="ta-grid">
        <label className="ta-field">
          <span>Hero titel</span>
          <input value={vacancy.heroTitle} onChange={(event) => onChange(updateVacancy(content, { heroTitle: event.target.value }))} />
        </label>
        <label className="ta-field ta-grid-wide">
          <span>Hero intro</span>
          <textarea value={vacancy.heroIntro} rows={3} onChange={(event) => onChange(updateVacancy(content, { heroIntro: event.target.value }))} />
        </label>
      </div>
      <p className="entra-meta">De hero-foto van Werken bij ons wijzig je bij Pagina-foto&apos;s.</p>
      <FormSaveBar onSave={onSave} saving={saving} />
    </div>
  );
}

export function ApplicationsPanel({ content, applications, onChange, onSave, saving, initialView, onViewChange }: Props) {
  const [view, setView] = useState<ApplicationsView>(initialView || "incoming");

  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView]);

  function changeView(next: ApplicationsView) {
    setView(next);
    onViewChange?.(next);
  }

  const copy = TITLES[view];

  return (
    <EntraShell brand="Sollicitaties" items={NAV} view={view} onChange={changeView} title={copy.title} subtitle={copy.subtitle}>
      {view === "incoming" ? <IncomingView content={content} applications={applications} /> : null}
      {view === "jobs" ? <JobsView content={content} onChange={onChange} onSave={onSave} saving={saving} /> : null}
      {view === "page" ? <PageView content={content} onChange={onChange} onSave={onSave} saving={saving} /> : null}
    </EntraShell>
  );
}
