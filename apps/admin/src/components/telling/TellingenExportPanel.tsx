import { useEffect, useState } from "react";
import { storeLabel, type CountList, type CountStaffRecord, type Location } from "@tresamigos/types";
import { api, apiBlob } from "../../lib/api";
import { EntraCommand, EntraCommands } from "./entraUi";

interface Props {
  locations: Location[];
}

export function TellingenExportPanel({ locations }: Props) {
  const [staff, setStaff] = useState<CountStaffRecord[]>([]);
  const [lists, setLists] = useState<CountList[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    locationId: "",
    staffId: "",
    listId: "",
    shift: "",
    status: ""
  });

  useEffect(() => {
    void Promise.all([
      api<{ staff: CountStaffRecord[] }>("/api/admin/tellingen/staff"),
      api<{ lists: CountList[] }>("/api/admin/tellingen/lists")
    ]).then(([staffData, listsData]) => {
      setStaff(staffData.staff);
      setLists(listsData.lists);
    });
  }, []);

  function query() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  }

  async function download(format: "csv" | "xlsx") {
    setBusy(true);
    setMessage("");
    try {
      const params = query();
      const path = `/api/admin/tellingen/export?format=${format}${params ? `&${params}` : ""}`;
      const { blob, filename } = await apiBlob(path);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand disabled={busy} onClick={() => void download("csv")}>
          Download CSV
        </EntraCommand>
        <EntraCommand disabled={busy} onClick={() => void download("xlsx")}>
          Download Excel
        </EntraCommand>
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
      </div>
      {message ? <p className="entra-empty">{message}</p> : null}
    </>
  );
}
