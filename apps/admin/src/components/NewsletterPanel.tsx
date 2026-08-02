import { useEffect, useMemo, useState } from "react";
import type { NewsletterSubscriber } from "@tresamigos/types";
import { api } from "../lib/api";
import { AdminSearchBar } from "./AdminListUi";

export function NewsletterPanel() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ subscribers: NewsletterSubscriber[] }>("/api/admin/newsletter");
      setSubscribers(data.subscribers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Abonnees laden mislukt.");
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return subscribers;
    return subscribers.filter(
      (subscriber) =>
        subscriber.email.toLowerCase().includes(normalized) ||
        (subscriber.name || "").toLowerCase().includes(normalized)
    );
  }, [subscribers, query]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    return subscribers.filter((subscriber) => {
      const date = new Date(subscriber.subscribedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [subscribers]);

  async function handleDelete(email: string) {
    if (!window.confirm(`Abonnee ${email} verwijderen?`)) return;
    try {
      await api(`/api/admin/newsletter/${encodeURIComponent(email)}`, { method: "DELETE" });
      setSubscribers((current) => current.filter((subscriber) => subscriber.email !== email));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Verwijderen mislukt.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Email", "Naam", "Datum"],
      ...filtered.map((subscriber) => [
        subscriber.email,
        subscriber.name || "",
        subscriber.subscribedAt || ""
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nieuwsbrief.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ta-stack" style={{ gap: 20 }}>
      <div className="ta-kpis">
        <div className="ta-kpi">
          <span>Abonnees totaal</span>
          <strong>{subscribers.length}</strong>
        </div>
        <div className="ta-kpi">
          <span>Deze maand</span>
          <strong>{thisMonth}</strong>
        </div>
        <div className="ta-kpi">
          <span>Exporteerbaar</span>
          <strong>CSV</strong>
        </div>
      </div>

      <div className="ta-toolbar ta-toolbar-spread" style={{ gap: 12, flexWrap: "wrap" }}>
        <AdminSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Zoek op naam of e-mail..."
          label="Nieuwsbrief zoeken"
        />
        <button type="button" className="ta-btn ta-btn-secondary" onClick={exportCsv} disabled={!filtered.length}>
          Exporteer CSV
        </button>
      </div>

      {error ? <p className="ta-error">{error}</p> : null}

      <div className="ta-table-wrap">
        <table className="ta-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Naam</th>
              <th>Ingeschreven op</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Laden...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4}>{subscribers.length ? "Geen resultaten." : "Nog geen abonnees."}</td>
              </tr>
            ) : (
              filtered.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td>
                    <code>{subscriber.email}</code>
                  </td>
                  <td>{subscriber.name || "—"}</td>
                  <td>{new Date(subscriber.subscribedAt).toLocaleDateString("nl-NL")}</td>
                  <td>
                    <button type="button" className="ta-btn ta-btn-danger ta-btn-sm" onClick={() => void handleDelete(subscriber.email)}>
                      Verwijder
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
