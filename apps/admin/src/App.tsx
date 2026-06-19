import { useState } from "react";
import { clearToken, login, setToken } from "./lib/api";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./AdminDashboard";

type AuthPhase = "login" | "leaving" | "entering" | "dashboard";

export default function App() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem("tres_amigos_admin_token")));
  const [phase, setPhase] = useState<AuthPhase>(authed ? "dashboard" : "login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(password: string) {
    setLoading(true);
    setMessage("");
    try {
      const data = await login(password);
      setToken(data.token);
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

  function handleLogout() {
    clearToken();
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
      <AdminDashboard onLogout={handleLogout} />
    </div>
  );
}
