import { FormEvent, useState } from "react";

interface Props {
  loading: boolean;
  message: string;
  onSubmit: (password: string) => Promise<void>;
}

export function AdminLogin({ loading, message, onSubmit }: Props) {
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit(password);
  }

  return (
    <div className="ta-login-page">
      <aside className="ta-login-visual">
        <img src="/assets/site/restaurant-interior.jpg" alt="Tres Amigos restaurant" />
        <div className="ta-login-visual-overlay">
          <img src="/assets/site/tres-amigos-logo-new.png" alt="Tres Amigos" />
          <h1>Eat like a Mexican.</h1>
          <p>Beheer vestigingen, menu, video&apos;s en sollicitaties vanuit één rustig dashboard.</p>
        </div>
      </aside>

      <section className="ta-login-panel">
        <form className="ta-login-card" onSubmit={handleSubmit}>
          <span className="ta-badge">Tres CMS</span>
          <h2>Welkom terug</h2>
          <p>Log in om content, bestelknoppen en aanvragen te beheren.</p>

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

          <button className="ta-btn ta-btn-primary ta-btn-block" type="submit" disabled={loading}>
            {loading ? "Bezig met inloggen..." : "Inloggen"}
          </button>

          {message ? <p className="ta-message">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
