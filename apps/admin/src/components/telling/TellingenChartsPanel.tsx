import { useEffect, useMemo, useState } from "react";
import { COUNT_SHIFT_LABELS, storeLabel, type CountList, type CountSessionSummary, type CountStaffRecord, type Location } from "@tresamigos/types";
import { api } from "../../lib/api";
import { WEEKDAY_NAMES, weekdayName } from "../../lib/countDates";
import { mergeTellingFilters, type TellingenOverviewFilters } from "../../lib/tellingFilters";
import { BarChart, DonutChart, chartColors } from "../DonutChart";
import { EntraCommand, EntraCommands } from "./entraUi";

interface Props {
  locations: Location[];
  onOpenOverview: (filters: Partial<TellingenOverviewFilters>) => void;
}

export function TellingenChartsPanel({ locations, onOpenOverview }: Props) {
  const [sessions, setSessions] = useState<CountSessionSummary[]>([]);
  const [staff, setStaff] = useState<CountStaffRecord[]>([]);
  const [lists, setLists] = useState<CountList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    locationId: "",
    staffId: "",
    listId: "",
    shift: "",
    status: ""
  });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
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
  }, [filters.dateFrom, filters.dateTo, filters.locationId, filters.staffId, filters.listId, filters.shift, filters.status]);

  function openOverview(patch: Partial<TellingenOverviewFilters>) {
    onOpenOverview(
      mergeTellingFilters({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        locationId: filters.locationId,
        staffId: filters.staffId,
        listId: filters.listId,
        shift: filters.shift,
        status: filters.status,
        ...patch
      })
    );
  }

  const submitted = sessions.filter((session) => session.status === "submitted").length;

  const listSegments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessions) {
      counts.set(session.listId, (counts.get(session.listId) || 0) + 1);
    }
    const colors = chartColors(Math.max(counts.size, 1));
    return [...counts.entries()].map(([listId, value], index) => ({
      id: listId,
      label: lists.find((list) => list.id === listId)?.title || sessions.find((session) => session.listId === listId)?.listTitle || listId,
      value,
      color: colors[index]
    }));
  }, [sessions, lists]);

  const locationSegments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessions) {
      counts.set(session.locationId, (counts.get(session.locationId) || 0) + 1);
    }
    const colors = chartColors(Math.max(counts.size, 1));
    return [...counts.entries()].map(([locationId, value], index) => {
      const location = locations.find((item) => item.id === locationId);
      const session = sessions.find((item) => item.locationId === locationId);
      return {
        id: locationId,
        label: storeLabel(location?.code || session?.locationCode, location?.name || session?.locationName || locationId),
        value,
        color: colors[index]
      };
    });
  }, [sessions, locations]);

  const shiftSegments = useMemo(() => {
    const morning = sessions.filter((session) => session.shift === "morning").length;
    const evening = sessions.filter((session) => session.shift === "evening").length;
    return [
      { id: "morning", label: COUNT_SHIFT_LABELS.morning, value: morning, color: "#fcb92a" },
      { id: "evening", label: COUNT_SHIFT_LABELS.evening, value: evening, color: "#0056d7" }
    ];
  }, [sessions]);

  const weekdayBars = useMemo(
    () =>
      WEEKDAY_NAMES.map((day) => ({
        id: day,
        label: `${day.charAt(0).toUpperCase()}${day.slice(1, 2)}`,
        value: sessions.filter((session) => weekdayName(session.countDate) === day).length
      })),
    [sessions]
  );

  const staffByStore = useMemo(
    () =>
      locations.map((location) => ({
        location,
        staff: staff.filter((user) => user.locationId === location.id),
        count: sessions.filter((session) => session.locationId === location.id).length
      })),
    [locations, staff, sessions]
  );

  const unassigned = staff.filter((user) => !user.locationId);

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
        <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
        <select value={filters.locationId} onChange={(event) => setFilters((current) => ({ ...current, locationId: event.target.value }))}>
          <option value="">Alle winkels</option>
          {locations.map((location) => (
            <option value={location.id} key={location.id}>
              {storeLabel(location.code, location.name)}
            </option>
          ))}
        </select>
        <select value={filters.staffId} onChange={(event) => setFilters((current) => ({ ...current, staffId: event.target.value }))}>
          <option value="">Iedereen</option>
          {staff.map((user) => (
            <option value={user.id} key={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select value={filters.listId} onChange={(event) => setFilters((current) => ({ ...current, listId: event.target.value }))}>
          <option value="">Alle lijsten</option>
          {lists.map((list) => (
            <option value={list.id} key={list.id}>
              {list.title}
            </option>
          ))}
        </select>
        <select value={filters.shift} onChange={(event) => setFilters((current) => ({ ...current, shift: event.target.value }))}>
          <option value="">Alle soorten</option>
          <option value="morning">Ochtendtelling</option>
          <option value="evening">Avondtelling</option>
        </select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">Alle statussen</option>
          <option value="submitted">Verzonden</option>
          <option value="draft">Concept</option>
        </select>
        <span className="entra-count">{loading ? "Laden…" : `${sessions.length} tellingen`}</span>
      </div>

      <div className="entra-kpis">
        <article>
          <span>Tellingen</span>
          <strong>{sessions.length}</strong>
        </article>
        <article>
          <span>Verzonden</span>
          <strong>{submitted}</strong>
        </article>
        <article>
          <span>Concept</span>
          <strong>{sessions.length - submitted}</strong>
        </article>
        <article>
          <span>Winkels</span>
          <strong>{locationSegments.length}</strong>
        </article>
      </div>

      <section className="ta-analytics-charts entra-charts">
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per weekdag</strong>
            <p>Klik op een dag, bijvoorbeeld dinsdag, om het overzicht te openen</p>
          </div>
          <BarChart data={weekdayBars} onSelect={(item) => openOverview({ weekday: item.id || item.label.toLowerCase() })} />
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per lijst</strong>
            <p>Klik op start of sluit om die lijst in het overzicht te zien</p>
          </div>
          {listSegments.some((item) => item.value) ? (
            <DonutChart segments={listSegments} centerLabel="LIJST" onSelect={(segment) => openOverview({ listId: segment.id || "" })} />
          ) : (
            <p className="entra-empty">Nog geen tellingen.</p>
          )}
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Per winkel</strong>
            <p>Klik op een vestiging om haar tellingen te openen</p>
          </div>
          {locationSegments.some((item) => item.value) ? (
            <DonutChart segments={locationSegments} centerLabel="WINKEL" onSelect={(segment) => openOverview({ locationId: segment.id || "" })} />
          ) : (
            <p className="entra-empty">Nog geen tellingen.</p>
          )}
        </article>
        <article className="ta-chart-card">
          <div className="ta-chart-card-head">
            <strong>Ochtend / avond</strong>
            <p>Klik om op soort te filteren</p>
          </div>
          {shiftSegments.some((item) => item.value) ? (
            <DonutChart segments={shiftSegments} centerLabel="SOORT" onSelect={(segment) => openOverview({ shift: segment.id || "" })} />
          ) : (
            <p className="entra-empty">Nog geen tellingen.</p>
          )}
        </article>
      </section>

      <section className="entra-store-staff">
        <div className="ta-chart-card-head">
          <strong>Werknemers per winkel</strong>
          <p>Wie er is ingesteld op elke vestiging. Klik door naar het overzicht.</p>
        </div>
        <div className="entra-store-grid">
          {staffByStore.map(({ location, staff: users, count }) => (
            <article className="entra-store-card" key={location.id}>
              <button type="button" className="entra-store-card-head" onClick={() => openOverview({ locationId: location.id })}>
                <strong>{storeLabel(location.code, location.name)}</strong>
                <span>{count} tellingen</span>
              </button>
              {users.length ? (
                <ul>
                  {users.map((user) => (
                    <li key={user.id}>
                      <button type="button" className="entra-link" onClick={() => openOverview({ locationId: location.id, staffId: user.id })}>
                        {user.name}
                      </button>
                      {user.active ? null : <span className="entra-pill">Inactief</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="entra-empty">Geen werknemers ingesteld.</p>
              )}
            </article>
          ))}
          {unassigned.length ? (
            <article className="entra-store-card">
              <div className="entra-store-card-head">
                <strong>Geen winkel</strong>
                <span>{unassigned.length} gebruikers</span>
              </div>
              <ul>
                {unassigned.map((user) => (
                  <li key={user.id}>
                    <button type="button" className="entra-link" onClick={() => openOverview({ staffId: user.id })}>
                      {user.name}
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      </section>
    </>
  );
}
