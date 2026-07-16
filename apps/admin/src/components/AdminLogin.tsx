import { FormEvent, useState } from "react";
import { AdminBadge } from "./AdminBadge";
import { AdminButton } from "./AdminButton";

interface Props {
  loading: boolean;
  message: string;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function AdminLogin({ loading, message, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(email, password);
  }

  return (
    <div className="ta-login-page">
      <aside className="ta-login-visual">
        <img src="/assets/site/restaurant-interior.jpg" alt="Tres Amigos restaurant" />
        <div className="ta-login-visual-overlay">
          <img className="ta-login-logo" src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos" />
          <h1>Eat like a Mexican.</h1>
          <p>Beheer vestigingen, menu, video&apos;s en sollicitaties vanuit één rustig dashboard.</p>
        </div>
      </aside>

      <section className="ta-login-panel">
        <form className="ta-login-card" onSubmit={handleSubmit}>
          <AdminBadge compact />
          <h2>Welkom terug</h2>

          <label className="ta-field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              placeholder="E-mailadres"
              required
            />
          </label>

          <label className="ta-field">
            <span>Wachtwoord</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          <AdminButton variant="primary" block type="submit" loading={loading} loadingText="Ring betreden...">
            Inloggen
          </AdminButton>

          {message ? <p className="ta-message">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
