interface Props {
  visible: boolean;
  title: string;
  message?: string;
  tone?: "loading" | "success" | "error";
}

function toneEmoji(tone: Props["tone"]) {
  if (tone === "success") return "🤼";
  if (tone === "error") return "😵";
  return "🌮";
}

export function AdminLoadingPopup({ visible, title, message, tone = "loading" }: Props) {
  if (!visible) return null;

  return (
    <div
      className={`ta-popup${tone === "success" ? " is-success is-fiesta" : ""}${tone === "error" ? " is-error" : ""}${tone === "loading" ? " is-loading" : ""}`}
      role="status"
    >
      {tone === "loading" ? (
        <div className="ta-spinner ta-spinner-taco" aria-hidden="true">
          <span>🌮</span>
        </div>
      ) : (
        <span className="ta-popup-emoji" aria-hidden="true">
          {toneEmoji(tone)}
        </span>
      )}
      <div>
        <strong>{title}</strong>
        {message ? <span>{message}</span> : null}
      </div>
    </div>
  );
}

export function AdminLoaderScreen({ label = "Dashboard laden..." }: { label?: string }) {
  return (
    <div className="ta-loader-screen ta-loader-enter">
      <div className="ta-loader-card ta-fade-in">
        <div className="ta-spinner ta-spinner-taco" aria-hidden="true">
          <span>🌮</span>
        </div>
        <strong>{label}</strong>
        <span className="ta-loader-sub">De ring wordt klaargezet...</span>
      </div>
    </div>
  );
}
