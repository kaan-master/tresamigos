import { ADMIN_APP_VERSION, ADMIN_CHANGELOG, formatAdminVersionLabel } from "../lib/changelog";

export function ChangelogPanel() {
  return (
    <section className="ta-panel ta-changelog-panel">
      <header className="ta-changelog-hero">
        <p className="ta-seo-hint" style={{ margin: 0 }}>
          VERSIE
        </p>
        <h2>Wijzigingen</h2>
        <p className="ta-changelog-lead">
          Je gebruikt versie {ADMIN_APP_VERSION}.
        </p>
      </header>

      <ol className="ta-changelog-list">
        {ADMIN_CHANGELOG.map((entry) => (
          <li key={entry.version} className={`ta-changelog-entry${entry.current ? " is-current" : ""}`}>
            <div className="ta-changelog-entry-head">
              <h3>
                Versie {entry.version}
                {entry.current ? <span className="ta-changelog-badge">Huidige versie</span> : null}
              </h3>
              <time dateTime={entry.date}>{entry.date}</time>
            </div>
            <ul>
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="ta-seo-hint ta-changelog-foot">{formatAdminVersionLabel()} · Tres Amigos Admin</p>
    </section>
  );
}
