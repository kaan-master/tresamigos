import { useEffect, useState } from "react";
import type { AdminSessionUser } from "@tresamigos/types";
import { clearToken, fetchMe, login, logoutApi, setToken } from "./lib/api";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./AdminDashboard";

type AuthPhase = "login" | "leaving" | "entering" | "dashboard";

export default function App() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem("tres_amigos_admin_token")));
  const [phase, setPhase] = useState<AuthPhase>(authed ? "dashboard" : "login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AdminSessionUser | null>(null);

  useEffect(() => {
    if (!authed) return;
    void fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        setAuthed(false);
        setPhase("login");
      });
  }, [authed]);

  async function handleLogin(email: string, password: string) {
    setLoading(true);
    setMessage("");
    try {
      const data = await login(email, password);
      setToken(data.token);
      setUser(data.user);
      setPhase("leaving");
      window.setTimeout(() => {
        setAuthed(true);
        setPhase("entering");
        window.setTimeout(() => setPhase("dashboard"), 900);
      }, 520);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login mislukt.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // best-effort
    }
    clearToken();
    setUser(null);
    setAuthed(false);
    setPhase("login");
    setLoading(false);
  }

  if (!authed) {
    return (
      <div className={`ta-auth-stage${phase === "leaving" ? " is-leaving" : ""}`}>
        <AdminLogin loading={loading} message={message} onSubmit={handleLogin} />
      </div>
    );
  }

  return (
    <div className={`ta-auth-stage${phase === "entering" ? " is-entering" : ""}`}>
      <AdminDashboard user={user} onLogout={() => void handleLogout()} />
    </div>
  );
}
