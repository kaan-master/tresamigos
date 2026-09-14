import { useEffect, useMemo, useState } from "react";
import { ADMIN_TAB_IDS, ADMIN_TAB_LABELS, type AdminTabId, type AdminUserRecord } from "@tresamigos/types";
import { useAdminFeedback } from "../context/AdminFeedbackContext";
import { createAdminUser, deleteAdminUser, listAdminUsers, updateAdminUser } from "../lib/api";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch } from "./telling/entraUi";
import { AdminButton } from "./AdminButton";

const createTabs = ADMIN_TAB_IDS.filter((tab) => tab !== "users");

function PermissionPicker({
  value,
  onChange,
  tabs
}: {
  value: AdminTabId[];
  onChange: (permissions: AdminTabId[]) => void;
  tabs: readonly AdminTabId[];
}) {
  function toggle(tab: AdminTabId) {
    onChange(value.includes(tab) ? value.filter((item) => item !== tab) : [...value, tab]);
  }

  return (
    <div className="ta-permission-grid">
      {tabs.map((tab) => (
        <label className="ta-permission-chip" key={tab}>
          <input type="checkbox" checked={value.includes(tab)} onChange={() => toggle(tab)} />
          <span>
            {tab === "home" ||
            tab === "pageMedia" ||
            tab === "navigation" ||
            tab === "footer" ||
            tab === "integrations" ||
            tab === "users"
              ? `Website · ${ADMIN_TAB_LABELS[tab]}`
              : ADMIN_TAB_LABELS[tab]}
          </span>
        </label>
      ))}
    </div>
  );
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  permissions: ["home"] as AdminTabId[]
};

export function UsersPanel() {
  const { runSave } = useAdminFeedback();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blade, setBlade] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({
    name: "",
    password: "",
    permissions: [] as AdminTabId[]
  });

  async function load() {
    setLoading(true);
    try {
      const data = await listAdminUsers();
      setUsers(data.users);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.permissions.some((tab) => ADMIN_TAB_LABELS[tab].toLowerCase().includes(q))
    );
  }, [users, query]);

  const selected = users.find((user) => user.id === selectedId) || null;

  function openCreate() {
    setForm(emptyForm);
    setMessage("");
    setBlade("create");
  }

  function openEdit(user: AdminUserRecord) {
    setSelectedId(user.id);
    setEditForm({
      name: user.name,
      password: "",
      permissions: [...user.permissions]
    });
    setMessage("");
    setBlade("edit");
  }

  async function handleCreate() {
    setMessage("");
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
      setMessage("Naam, e-mail en wachtwoord (min. 8 tekens) zijn verplicht.");
      return;
    }
    try {
      await runSave(
        async () => {
          await createAdminUser(form);
          setForm(emptyForm);
          setBlade(null);
        },
        {
          refresh: load,
          successMessage: "Medewerker aangemaakt en lijst vernieuwd."
        }
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aanmaken mislukt.");
    }
  }

  async function handleSaveEdit(userId: string) {
    setMessage("");
    try {
      await runSave(
        async () => {
          await updateAdminUser(userId, {
            name: editForm.name.trim(),
            permissions: editForm.permissions,
            ...(editForm.password ? { password: editForm.password } : {})
          });
          setBlade(null);
        },
        {
          refresh: load,
          successMessage: "Rechten opgeslagen en vernieuwd."
        }
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bijwerken mislukt.");
    }
  }

  async function toggleActive(user: AdminUserRecord) {
    try {
      await runSave(
        async () => {
          await updateAdminUser(user.id, { active: !user.active });
        },
        {
          refresh: load,
          successMessage: "Status bijgewerkt en vernieuwd."
        }
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bijwerken mislukt.");
    }
  }

  async function removeUser(id: string) {
    if (!window.confirm("Deze medewerker definitief verwijderen?")) return;
    try {
      if (selectedId === id) {
        setSelectedId(null);
        setBlade(null);
      }
      await runSave(
        async () => {
          await deleteAdminUser(id);
        },
        {
          refresh: load,
          successMessage: "Medewerker verwijderd en lijst vernieuwd."
        }
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt.");
    }
  }

  return (
    <>
      <EntraCommands>
        <EntraCommand onClick={openCreate}>Nieuwe medewerker</EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && openEdit(selected)}>
          Bewerken
        </EntraCommand>
        <EntraCommand disabled={!selected} onClick={() => selected && void toggleActive(selected)}>
          {selected?.active === false ? "Activeren" : "Deactiveren"}
        </EntraCommand>
        <EntraCommand danger disabled={!selected} onClick={() => selected && void removeUser(selected.id)}>
          Verwijderen
        </EntraCommand>
        <EntraCommand onClick={() => void load()}>Vernieuwen</EntraCommand>
      </EntraCommands>

      <div className="entra-toolbar entra-toolbar-wrap">
        <EntraSearch value={query} onChange={setQuery} placeholder="Zoek op naam, e-mail of recht" />
        <span className="entra-count">{loading ? "Laden…" : `${filtered.length} medewerkers`}</span>
      </div>

      <div className="entra-table-wrap">
        <table className="entra-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>E-mail</th>
              <th>Rechten</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className={user.id === selectedId ? "is-selected" : ""}
                onClick={() => {
                  setSelectedId(user.id);
                  openEdit(user);
                }}
              >
                <td>
                  <button
                    type="button"
                    className="entra-link"
                    onClick={() => {
                      setSelectedId(user.id);
                      openEdit(user);
                    }}
                  >
                    {user.name}
                  </button>
                </td>
                <td>{user.email}</td>
                <td>{user.permissions.map((tab) => ADMIN_TAB_LABELS[tab]).join(" · ") || "Geen rechten"}</td>
                <td>
                  <span className={`entra-pill${user.active ? " is-on" : ""}`}>{user.active ? "Actief" : "Uit"}</span>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length ? (
              <tr>
                <td colSpan={4} className="entra-empty">
                  {users.length ? "Geen medewerkers voor deze zoekopdracht." : "Nog geen medewerkers aangemaakt."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {blade === "create" ? (
        <EntraBlade title="Nieuwe medewerker" onClose={() => setBlade(null)}>
          <label>
            Naam
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            E-mail
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label>
            Wachtwoord (min. 8 tekens)
            <input
              type="password"
              value={form.password}
              minLength={8}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <div className="ta-field">
            <span>Toegang tot</span>
            <PermissionPicker
              tabs={createTabs}
              value={form.permissions}
              onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
            />
          </div>
          {message ? <p className="entra-error">{message}</p> : null}
          <AdminButton variant="primary" type="button" onClick={() => void handleCreate()}>
            Medewerker aanmaken
          </AdminButton>
        </EntraBlade>
      ) : null}

      {blade === "edit" && selected ? (
        <EntraBlade title={selected.name} onClose={() => setBlade(null)}>
          <label>
            Naam
            <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Nieuw wachtwoord (optioneel)
            <input
              type="password"
              value={editForm.password}
              minLength={8}
              placeholder="Laat leeg om ongewijzigd te laten"
              onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <div className="ta-field">
            <span>Toegang tot</span>
            <PermissionPicker
              tabs={ADMIN_TAB_IDS}
              value={editForm.permissions}
              onChange={(permissions) => setEditForm((current) => ({ ...current, permissions }))}
            />
          </div>
          {message ? <p className="entra-error">{message}</p> : null}
          <AdminButton variant="primary" type="button" onClick={() => void handleSaveEdit(selected.id)}>
            Rechten opslaan
          </AdminButton>
        </EntraBlade>
      ) : null}
    </>
  );
}
