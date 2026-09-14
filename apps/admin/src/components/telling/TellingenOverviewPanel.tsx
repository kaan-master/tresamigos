import { useEffect, useMemo, useState } from "react";
import { COUNT_SHIFT_LABELS, storeLabel, type CountList, type CountSession, type CountSessionSummary, type CountStaffRecord, type Location } from "@tresamigos/types";
import { api } from "../../lib/api";
import { WEEKDAY_NAMES, formatCountDate, weekdayName } from "../../lib/countDates";
import { EMPTY_TELLING_FILTERS, type TellingenOverviewFilters } from "../../lib/tellingFilters";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch } from "./entraUi";

interface Props {
  locations: Location[];
  filters: TellingenOverviewFilters;
  onFiltersChange: (filters: TellingenOverviewFilters) => void;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export function TellingenOverviewPanel({ locations, filters, onFiltersChange }: Props) {
  const [sessions, setSessions] = useState<CountSessionSummary[]>([]);
  const [staff, setStaff] = useState<CountStaffRecord[]>([]);
  const [lists, setLists] = useState<CountList[]>([]);
  const [selected, setSelected] = useState<CountSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  function setFilter<K extends keyof TellingenOverviewFilters>(key: K, value: TellingenOverviewFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;
      if (key === "productName" && filters.productId) continue;
      params.set(key, value);
    }
    const suffix = params.toString() ? `?${params}` : "";
    try {
      const [sessionData, staffData, listsData] = await Promise.all([
        api<{ sessions: CountSessionSummary[] }>(`/api/admin/tellingen/sessions${suffix}`),
        api<{ staff: CountStaffRecord[] }>("/api/admin/tellingen/staff"),
        api<{ lists: CountList[] }>("/api/admin/tellingen/lists")
      ]);
      setSessions(sessionData.sessions);
      setStaff(staffData.staff);
      setLists(listsData.lists);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.locationId,
    filters.staffId,
    filters.listId,
    filters.weekday,
    filters.shift,
    filters.status,
    filters.productId,
    filters.productName,
    filters.categoryName
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (session) =>
        session.locationName.toLowerCase().includes(q) ||
        (session.locationCode || "").toLowerCase().includes(q) ||
        session.staffName.toLowerCase().includes(q) ||
        session.listTitle.toLowerCase().includes(q) ||
        session.countDate.includes(q) ||
        weekdayName(session.countDate).includes(q)
    );
  }, [sessions, query]);

  async function openSession(id: string) {
    const data = await api<{ session: CountSession }>(`/api/admin/tellingen/sessions/${id}`);
    setSelected(data.session);
  }

  const groupedLines = useMemo(() => {
    if (!selected) return [];
    const groups = new Map<string, CountSession["lines"]>();
    for (const line of selected.lines) {
      const current = groups.get(line.categoryName) || [];
      current.push(line);
      groups.set(line.categoryName, current);
    }
    return [...groups.entries()];
  }, [selected]);

  const storeStaff = useMemo(
    () => (filters.locationId ? staff.filter((user) => user.locationId === filters.locationId) : []),
    [staff, filters.locationId]
  );

  const selectedLocation = locations.find((location) => location.id === filters.locationId);
  const selectedList = lists.find((list) => list.id === filters.listId);
  const hasChartFilter = Boolean(
    filters.weekday || filters.productId || filters.productName || filters.categoryName || filters.listId || filters.locationId || filters.shift
  );

  return (
    <>
      <EntraCommands>
        <EntraCommand disabled={!selected} onClick={() => selected && void openSession(selected.id)}>
          Openen
        </EntraCommand>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
        {hasChartFilter ? (
          <EntraCommand onClick={() => onFiltersChange(EMPTY_TELLING_FILTERS)}>Filters wissen</EntraCommand>
        ) : null}
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek op winkel, dag, gebruiker of datum" />
        <input type="date" value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} />
        <input type="date" value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} />
        <select value={filters.locationId} onChange={(event) => setFilter("locationId", event.target.value)}>
          <option value="">Alle winkels</option>
          {locations.map((location) => (
            <option value={location.id} key={location.id}>
              {storeLabel(location.code, location.name)}
            </option>
          ))}
        </select>
        <select value={filters.staffId} onChange={(event) => setFilter("staffId", event.target.value)}>
          <option value="">Iedereen</option>
          {staff.map((user) => (
            <option value={user.id} key={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select value={filters.listId} onChange={(event) => setFilter("listId", event.target.value)}>
          <option value="">Alle lijsten</option>
          {lists.map((list) => (
            <option value={list.id} key={list.id}>
              {list.title}
            </option>
          ))}
        </select>
        <select value={filters.weekday} onChange={(event) => setFilter("weekday", event.target.value)}>
          <option value="">Alle dagen</option>
          {WEEKDAY_NAMES.map((day) => (
            <option value={day} key={day}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </option>
          ))}
        </select>
        <select value={filters.shift} onChange={(event) => setFilter("shift", event.target.value)}>
          <option value="">Alle soorten</option>
          <option value="morning">Ochtendtelling</option>
          <option value="evening">Avondtelling</option>
        </select>
        <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
          <option value="">Alle statussen</option>
          <option value="submitted">Verzonden</option>
          <option value="draft">Concept</option>
        </select>
        <span className="entra-count">{loading ? "Laden…" : `${filtered.length} tellingen gevonden`}</span>
      </div>

      {hasChartFilter ? (
        <div className="entra-filter-chips">
          {filters.weekday ? (
            <span className="entra-chip">
              {filters.weekday.charAt(0).toUpperCase() + filters.weekday.slice(1)}
              <button type="button" onClick={() => setFilter("weekday", "")} aria-label="Dagfilter wissen">
                ×
              </button>
            </span>
          ) : null}
          {selectedList ? (
            <span className="entra-chip">
              {selectedList.title}
              <button type="button" onClick={() => setFilter("listId", "")} aria-label="Lijstfilter wissen">
                ×
              </button>
            </span>
          ) : null}
          {selectedLocation ? (
            <span className="entra-chip">
              {storeLabel(selectedLocation.code, selectedLocation.name)}
              <button type="button" onClick={() => setFilter("locationId", "")} aria-label="Winkelfilter wissen">
                ×
              </button>
            </span>
          ) : null}
          {filters.productName ? (
            <span className="entra-chip">
              {filters.productName}
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, productId: "", productName: "" })}
                aria-label="Productfilter wissen"
              >
                ×
              </button>
            </span>
          ) : null}
          {filters.categoryName ? (
            <span className="entra-chip">
              {filters.categoryName}
              <button type="button" onClick={() => setFilter("categoryName", "")} aria-label="Categoriefilter wissen">
                ×
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      {filters.locationId ? (
        <div className="entra-staff-strip">
          <span>Werknemers {selectedLocation ? `in ${storeLabel(selectedLocation.code, selectedLocation.name)}` : ""}</span>
          {storeStaff.length ? (
            <ul>
              {storeStaff.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className={`entra-chip-btn${filters.staffId === user.id ? " is-active" : ""}`}
                    onClick={() => setFilter("staffId", filters.staffId === user.id ? "" : user.id)}
                  >
                    {user.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <em>Geen werknemers ingesteld op deze winkel.</em>
          )}
        </div>
      ) : null}

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Winkel</th>
              <th>Lijst</th>
              <th>Gebruiker</th>
              <th>Dag</th>
              <th>Datum</th>
              <th>Tijd</th>
              <th>Soort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr
                key={session.id}
                className={selected?.id === session.id ? "is-selected" : ""}
                onClick={() => void openSession(session.id)}
              >
                <td>
                  <button type="button" className="entra-link" onClick={() => void openSession(session.id)}>
                    {storeLabel(session.locationCode, session.locationName)}
                  </button>
                </td>
                <td>{session.listTitle}</td>
                <td>{session.staffName}</td>
                <td className="entra-day">{weekdayName(session.countDate)}</td>
                <td>{formatCountDate(session.countDate)}</td>
                <td>{timeLabel(session.submittedAt || session.updatedAt)}</td>
                <td>{COUNT_SHIFT_LABELS[session.shift]}</td>
                <td>
                  <span className={`entra-pill${session.status === "submitted" ? " is-on" : ""}`}>
                    {session.status === "submitted" ? "Verzonden" : "Concept"}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length ? (
              <tr>
                <td colSpan={8} className="entra-empty">
                  Geen tellingen voor deze filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <EntraBlade
          title={`${storeLabel(selected.locationCode, selected.locationName)} · ${selected.listTitle} · ${COUNT_SHIFT_LABELS[selected.shift]}`}
          onClose={() => setSelected(null)}
        >
          <p className="entra-meta">
            {selected.staffName} · {weekdayName(selected.countDate)} {formatCountDate(selected.countDate)} · {timeLabel(selected.submittedAt || selected.updatedAt)} ·{" "}
            {selected.status === "submitted" ? "Verzonden" : "Concept"}
          </p>
          {groupedLines.map(([category, lines]) => (
            <section key={category} className="entra-detail-group">
              <h4>{category}</h4>
              <table className="entra-table entra-table-compact">
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id}>
                      <td>{line.productName}</td>
                      <td>{line.quantity === null ? "—" : String(line.quantity).replace(".", ",")}</td>
                      <td>{line.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </EntraBlade>
      ) : null}
    </>
  );
}
