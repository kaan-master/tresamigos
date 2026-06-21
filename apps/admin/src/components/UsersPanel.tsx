import { FormEvent, useEffect, useState } from "react";
import { ADMIN_TAB_IDS, ADMIN_TAB_LABELS, type AdminTabId, type AdminUserRecord } from "@tresamigos/types";
import { AdminButton } from "./AdminButton";
import { createAdminUser, deleteAdminUser, listAdminUsers, updateAdminUser } from "../lib/api";

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
          <span>{ADMIN_TAB_LABELS[tab]}</span>
        </label>
      ))}
    </div>
  );
}

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: ["home"] as AdminTabId[]
  });
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

  function startEdit(user: AdminUserRecord) {
    setEditingId(user.id);
    setEditForm({
      name: user.name,
      password: "",
      permissions: [...user.permissions]
    });
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", password: "", permissions: [] });
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await createAdminUser(form);
      setForm({ name: "", email: "", password: "", permissions: ["home"] });
      setMessage("Medewerker aangemaakt.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aanmaken mislukt.");
    }
  }

  async function handleSaveEdit(userId: string) {
    setMessage("");
    try {
      await updateAdminUser(userId, {
        name: editForm.name.trim(),
        permissions: editForm.permissions,
        ...(editForm.password ? { password: editForm.password } : {})
      });
      setMessage("Rechten opgeslagen.");
      cancelEdit();
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bijwerken mislukt.");
    }
  }

  async function toggleActive(user: AdminUserRecord) {
    try {
      await updateAdminUser(user.id, { active: !user.active });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bijwerken mislukt.");
    }
  }

  async function removeUser(id: string) {
    if (!window.confirm("Deze medewerker definitief verwijderen?")) return;
    try {
      if (editingId === id) cancelEdit();
      await deleteAdminUser(id);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verwijderen mislukt.");
    }
  }

  return (
    <div className="ta-home-stack">
      <article className="ta-home-card">
        <header className="ta-home-card-head">
          <h3>Medewerker toevoegen</h3>
          <p>Maak subaccounts aan en kies welke onderdelen ze mogen beheren.</p>
        </header>
        <form className="ta-grid" onSubmit={handleCreate}>
          <label className="ta-field">
            <span>Naam</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="ta-field">
            <span>E-mail</span>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="ta-field ta-grid-wide">
            <span>Wachtwoord (min. 8 tekens)</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} minLength={8} required />
          </label>
          <div className="ta-field ta-grid-wide">
            <span>Toegang tot</span>
            <PermissionPicker
              tabs={createTabs}
              value={form.permissions}
              onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
            />
          </div>
          <div className="ta-grid-wide">
            <AdminButton variant="primary" type="submit">
              Medewerker aanmaken
            </AdminButton>
          </div>
        </form>
      </article>

      <article className="ta-home-card">
        <header className="ta-home-card-head">
          <h3>Medewerkers</h3>
          <p>{loading ? "Laden…" : `${users.length} account(s)`}</p>
        </header>
        <div className="ta-user-list">
          {users.map((user) => (
            <div className={`ta-user-row-wrap${editingId === user.id ? " is-editing" : ""}`} key={user.id}>
              <div className="ta-user-row">
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <small>{user.permissions.map((tab) => ADMIN_TAB_LABELS[tab]).join(" · ") || "Geen rechten"}</small>
                </div>
                <div className="ta-user-actions">
                  <AdminButton variant="ghost" type="button" onClick={() => (editingId === user.id ? cancelEdit() : startEdit(user))}>
                    {editingId === user.id ? "Annuleren" : "Rechten bewerken"}
                  </AdminButton>
                  <AdminButton variant="ghost" type="button" onClick={() => void toggleActive(user)}>
                    {user.active ? "Deactiveren" : "Activeren"}
                  </AdminButton>
                  <AdminButton variant="danger" type="button" onClick={() => void removeUser(user.id)}>
                    Verwijderen
                  </AdminButton>
                </div>
              </div>

              {editingId === user.id ? (
                <div className="ta-user-edit">
                  <label className="ta-field">
                    <span>Naam</span>
                    <input
                      value={editForm.name}
                      onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="ta-field">
                    <span>Nieuw wachtwoord (optioneel)</span>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
                      minLength={8}
                      placeholder="Laat leeg om ongewijzigd te laten"
                    />
                  </label>
                  <div className="ta-field ta-grid-wide">
                    <span>Toegang tot</span>
                    <PermissionPicker
                      tabs={ADMIN_TAB_IDS}
                      value={editForm.permissions}
                      onChange={(permissions) => setEditForm((current) => ({ ...current, permissions }))}
                    />
                  </div>
                  <div className="ta-user-edit-actions">
                    <AdminButton variant="primary" type="button" onClick={() => void handleSaveEdit(user.id)}>
                      Rechten opslaan
                    </AdminButton>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {!loading && !users.length ? <div className="ta-empty">Nog geen medewerkers aangemaakt.</div> : null}
        </div>
      </article>

      {message ? <p className="ta-message">{message}</p> : null}
    </div>
  );
}
