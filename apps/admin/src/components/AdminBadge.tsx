export function AdminBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ta-badge-saiyan${compact ? " is-compact" : ""}`} aria-label="Tres CMS">
      <span className="ta-badge-saiyan-glow" aria-hidden="true" />
      <span className="ta-badge-saiyan-core">
        <span className="ta-badge-saiyan-dot" aria-hidden="true" />
        <span className="ta-badge-saiyan-text">
          <strong>TRES</strong>
          <em>CMS</em>
        </span>
        <span className="ta-badge-saiyan-spark" aria-hidden="true">
          🌮
        </span>
      </span>
    </div>
  );
}
