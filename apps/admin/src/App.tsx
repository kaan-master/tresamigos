import { useState } from "react";
import { clearToken, login, setToken } from "./lib/api";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./AdminDashboard";

export default function App() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem("tres_amigos_admin_token")));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(password: string) {
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
  }

  if (!authed) {
    return <AdminLogin loading={loading} message={message} onSubmit={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
