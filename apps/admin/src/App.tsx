import { FormEvent, useState } from "react";
import { clearToken, login, setToken } from "./lib/api";
import { AdminDashboard } from "./AdminDashboard";

export default function App() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem("tres_amigos_admin_token")));
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await login(password);
      setToken(data.token);
      setAuthed(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login mislukt.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setPassword("");
  }

  if (!authed) {
    return (
      <main className="admin-shell">
        <section className="admin-content">
          <form className="admin-login-card" onSubmit={handleLogin}>
            <p className="mini-label">Tres CMS</p>
            <h2>Admin login</h2>
            <label>
              Wachtwoord
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Bezig..." : "Inloggen"}
            </button>
            <p className="admin-message">{message}</p>
          </form>
        </section>
      </main>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
