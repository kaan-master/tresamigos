import { useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_TAB_LABELS, type AdminTabId, type AdminUserRecord } from "@tresamigos/types";
import { useAdminFeedback } from "../context/AdminFeedbackContext";
import { createAdminUser, deleteAdminUser, listAdminUsers, updateAdminUser } from "../lib/api";
import { readAvatarFile } from "../lib/avatarFile";
import { EntraBlade, EntraCommand, EntraCommands, EntraSearch } from "./telling/entraUi";
import { AdminButton } from "./AdminButton";

const ACCESS_GROUPS: Array<{ label: string; items: Array<{ id: AdminTabId; label: string }> }> = [
  { label: "Overzicht", items: [{ id: "overview", label: "Overzicht" }] },
  {
    label: "Inhoud",
    items: [
      { id: "locations", label: "Vestigingen" },
      { id: "products", label: "Producten" },
      { id: "media", label: "Media" },
      { id: "seo", label: "SEO" }
    ]
  },
  {
    label: "Website-instellingen",
    items: [
      { id: "home", label: "Home-tekst" },
      { id: "pageMedia", label: "Pagina-foto's" },
      { id: "navigation", label: "Menu" },
      { id: "footer", label: "Footer" },
      { id: "integrations", label: "Koppelingen" },
      { id: "users", label: "Gebruikers" }
    ]
  },
  {
    label: "Aanvragen",
    items: [
      { id: "applications", label: "Sollicitaties" },
      { id: "franchise", label: "Franchise" },
      { id: "newsletter", label: "Nieuwsbrief" },
      { id: "catering", label: "Catering" },
      { id: "reviews", label: "Reviews" }
    ]
  },
  {
    label: "Beheer",
    items: [
      { id: "todo", label: "To do" },
      { id: "tellingen", label: "Tellingen" }
    ]
  }
];

const ACCESS_LABELS = new Map(ACCESS_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item.label] as const)));

/** franchiseShop is an alias of franchise (merged hub). */
function normalizePermissions(permissions: AdminTabId[]): AdminTabId[] {
  const next = permissions.filter((tab) => tab !== "franchiseShop");
  if (permissions.includes("franchiseShop") && !next.includes("franchise")) {
    next.push("franchise");
  }
  return next;
}

function PermissionPicker({
  value,
  onChange
}: {
  value: AdminTabId[];
  onChange: (permissions: AdminTabId[]) => void;
}) {
  function toggle(tab: AdminTabId) {
    onChange(value.includes(tab) ? value.filter((item) => item !== tab) : [...value, tab]);
  }

  return (
    <div className="ta-permission-list">
      {ACCESS_GROUPS.map((group) => (
        <section className="ta-permission-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map((item) => (
            <label className="ta-permission-row" key={item.id}>
              <input type="checkbox" checked={value.includes(item.id)} onChange={() => toggle(item.id)} />
              <span>{item.label}</span>
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}

function permissionSummary(permissions: AdminTabId[]) {
  const labels = normalizePermissions(permissions).map((tab) => ACCESS_LABELS.get(tab) || ADMIN_TAB_LABELS[tab]);
  return labels.length ? labels.join(" · ") : "Geen rechten";
}

function UserAvatarField({
  name,
  value,
  onChange
}: {
  name: string;
  value: string;
  onChange: (avatarData: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const letters = name.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <div className="ta-avatar-field">
      <span>Profielfoto</span>
      <div className="ta-avatar-field-row">
        <span className={`ta-avatar-preview${value ? " has-photo" : ""}`}>
          {value ? <img src={value} alt="" /> : letters}
        </span>
        <div>
          <p>Deze foto staat bij de persoon op het kanbanbord.</p>
          <div className="ta-avatar-actions">
            <button type="button" onClick={() => inputRef.current?.click()}>
              Foto uploaden
            </button>
            {value ? (
              <button type="button" onClick={() => onChange("")}>
                Verwijderen
              </button>
            ) : null}
          </div>
          {error ? <p className="entra-error">{error}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setError("");
          void readAvatarFile(file)
            .then(onChange)
            .catch((readError: unknown) => setError(readError instanceof Error ? readError.message : "Uploaden mislukt."));
        }}
      />
    </div>
  );
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  avatarData: "",
  permissions: ["overview"] as AdminTabId[]
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
    avatarData: "",
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
      avatarData: user.avatarData || "",
      permissions: normalizePermissions(user.permissions)
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
          await createAdminUser({
            ...form,
            permissions: normalizePermissions(form.permissions)
          });
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
            permissions: normalizePermissions(editForm.permissions),
            avatarData: editForm.avatarData,
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
    <div data-quiet-skip="">
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
                    className="entra-link ta-user-name"
                    onClick={() => {
                      setSelectedId(user.id);
                      openEdit(user);
                    }}
                  >
                    <span className={`ta-avatar-preview is-small${user.avatarData ? " has-photo" : ""}`}>
                      {user.avatarData ? <img src={user.avatarData} alt="" /> : user.name.trim().slice(0, 2).toUpperCase()}
                    </span>
                    {user.name}
                  </button>
                </td>
                <td>{user.email}</td>
                <td>{permissionSummary(user.permissions)}</td>
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
          <UserAvatarField
            name={form.name}
            value={form.avatarData}
            onChange={(avatarData) => setForm((current) => ({ ...current, avatarData }))}
          />
          <div className="ta-field">
            <span>Toegang tot</span>
            <PermissionPicker
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
          <UserAvatarField
            name={editForm.name}
            value={editForm.avatarData}
            onChange={(avatarData) => setEditForm((current) => ({ ...current, avatarData }))}
          />
          <div className="ta-field">
            <span>Toegang tot</span>
            <PermissionPicker
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
    </div>
  );
}
