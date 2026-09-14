import { useEffect, useMemo, useState } from "react";
import { storeLabel, type CountStaffRecord, type Location } from "@tresamigos/types";
import { useAdminFeedback } from "../../context/AdminFeedbackContext";
import { api } from "../../lib/api";
import { AdminButton } from "../AdminButton";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch } from "./entraUi";

interface Props {
  locations: Location[];
}

export function TellingenStaffPanel({ locations }: Props) {
  const { runSave } = useAdminFeedback();
  const [staff, setStaff] = useState<CountStaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blade, setBlade] = useState<"create" | "edit" | null>(null);
  const [revealedPin, setRevealedPin] = useState("");
  const [form, setForm] = useState({ name: "", loginNumber: "", locationId: "", active: true });

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ staff: CountStaffRecord[] }>("/api/admin/tellingen/staff");
      setStaff(data.staff);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        (user.locationName || "").toLowerCase().includes(q) ||
        (user.locationCode || "").includes(q) ||
        user.loginHint.includes(q)
    );
  }, [staff, query]);

  const selected = staff.find((user) => user.id === selectedId) || null;

  function openCreate() {
    setForm({ name: "", loginNumber: "", locationId: "", active: true });
    setRevealedPin("");
    setBlade("create");
  }

  function openEdit(user: CountStaffRecord) {
    setSelectedId(user.id);
    setForm({
      name: user.name,
      loginNumber: "",
      locationId: user.locationId || "",
      active: user.active
    });
    setRevealedPin("");
    setBlade("edit");
  }

  async function handleCreate() {
    if (form.loginNumber && form.loginNumber.length !== 9) return;
    await runSave(
      async () => {
        const data = await api<{ staff: CountStaffRecord; loginNumber: string }>("/api/admin/tellingen/staff", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            loginNumber: form.loginNumber || undefined,
            locationId: form.locationId || null,
            active: form.active
          })
        });
        setRevealedPin(data.loginNumber);
        setSelectedId(data.staff.id);
      },
      { refresh: load, successMessage: "Gebruiker aangemaakt. Noteer het inlognummer." }
    );
  }

  async function handleSave() {
    if (!selected) return;
    if (form.loginNumber && form.loginNumber.length !== 9) return;
    await runSave(
      async () => {
        const data = await api<{ staff: CountStaffRecord; loginNumber?: string }>(`/api/admin/tellingen/staff/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            locationId: form.locationId || null,
            active: form.active,
            ...(form.loginNumber ? { loginNumber: form.loginNumber } : {})
          })
        });
        if (data.loginNumber) setRevealedPin(data.loginNumber);
      },
      { refresh: load, successMessage: "Gebruiker opgeslagen." }
    );
  }

  async function toggleSelected(active: boolean) {
    if (!selected) return;
    await runSave(
      async () => {
        await api(`/api/admin/tellingen/staff/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify({ active })
        });
      },
      { refresh: load, successMessage: active ? "Gebruiker geactiveerd." : "Gebruiker geblokkeerd." }
    );
  }

  async function removeSelected() {
    if (!selected) return;
    if (!window.confirm(`${selected.name} verwijderen?`)) return;
    await runSave(
      async () => {
        await api(`/api/admin/tellingen/staff/${selected.id}`, { method: "DELETE" });
        setSelectedId(null);
        setBlade(null);
      },
      { refresh: load, successMessage: "Gebruiker verwijderd." }
    );
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={openCreate}>+ Gebruiker</EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && openEdit(selected)}>
          Bewerken
        </EntraCommand>
        <EntraCommand disabled={!selected?.active} onClick={() => void toggleSelected(false)}>
          Blokkeren
        </EntraCommand>
        <EntraCommand disabled={!selected || selected.active} onClick={() => void toggleSelected(true)}>
          Activeren
        </EntraCommand>
        <EntraCommand danger disabled={!selected} onClick={() => void removeSelected()}>
          Verwijderen
        </EntraCommand>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek op naam, winkel of nummer" />
        <span className="entra-count">{loading ? "Laden…" : `${filtered.length} gebruikers gevonden`}</span>
      </div>

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Inlognummer</th>
              <th>Winkel</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className={selectedId === user.id ? "is-selected" : ""}
                onClick={() => setSelectedId(user.id)}
                onDoubleClick={() => openEdit(user)}
              >
                <td>
                  <button type="button" className="entra-link" onClick={() => openEdit(user)}>
                    {user.name}
                  </button>
                </td>
                <td>•••••{user.loginHint}</td>
                <td>{user.locationId ? storeLabel(user.locationCode, user.locationName || "") : "—"}</td>
                <td>
                  <span className={`entra-pill${user.active ? " is-on" : ""}`}>{user.active ? "Actief" : "Inactief"}</span>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length ? (
              <tr>
                <td colSpan={4} className="entra-empty">
                  Geen gebruikers.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {blade ? (
        <EntraBlade title={blade === "create" ? "Gebruiker toevoegen" : "Gebruiker bewerken"} onClose={() => setBlade(null)}>
          <label>
            Naam
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            {blade === "create" ? "Inlognummer (9 cijfers, optioneel)" : "Nieuw inlognummer (9 cijfers)"}
            <input
              inputMode="numeric"
              maxLength={9}
              autoComplete="off"
              value={form.loginNumber}
              onChange={(event) => setForm((current) => ({ ...current, loginNumber: event.target.value.replace(/\D/g, "").slice(0, 9) }))}
              placeholder={blade === "create" ? "Leeg = automatisch" : "Alleen invullen om te wijzigen"}
            />
          </label>
          {form.loginNumber && form.loginNumber.length !== 9 ? (
            <p className="entra-error">Het inlognummer moet 9 cijfers zijn.</p>
          ) : null}
          <label>
            Basiswinkel
            <select value={form.locationId} onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))}>
              <option value="">Geen (gebruiker kiest zelf)</option>
              {locations.map((location) => (
                <option value={location.id} key={location.id}>
                  {storeLabel(location.code, location.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={form.active ? "active" : "inactive"}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === "active" }))}
            >
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>
          </label>
          {revealedPin ? (
            <p className="entra-pin">
              Inlognummer (bewaar dit): <strong>{revealedPin}</strong>
              <button
                type="button"
                className="entra-copy"
                onClick={() => void navigator.clipboard.writeText(revealedPin)}
              >
                Kopieer
              </button>
            </p>
          ) : null}
          <AdminButton
            variant="primary"
            type="button"
            onClick={() => void (blade === "create" ? handleCreate() : handleSave())}
            disabled={!form.name.trim() || Boolean(form.loginNumber && form.loginNumber.length !== 9)}
          >
            {blade === "create" ? "Aanmaken" : "Opslaan"}
          </AdminButton>
        </EntraBlade>
      ) : null}
    </>
  );
}
