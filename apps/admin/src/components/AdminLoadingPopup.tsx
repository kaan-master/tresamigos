interface Props {
  visible: boolean;
  title: string;
  message?: string;
  tone?: "loading" | "success" | "error";
}

export function AdminLoadingPopup({ visible, title, message, tone = "loading" }: Props) {
  if (!visible) return null;

  return (
    <div className={`ta-popup${tone === "success" ? " is-success" : ""}${tone === "error" ? " is-error" : ""}`} role="status">
      {tone === "loading" ? <div className="ta-spinner" aria-hidden="true" /> : null}
      <div>
        <strong>{title}</strong>
        {message ? <span>{message}</span> : null}
      </div>
    </div>
  );
}

export function AdminLoaderScreen({ label = "Dashboard laden..." }: { label?: string }) {
  return (
    <div className="ta-loader-screen">
      <div className="ta-loader-card ta-fade-in">
        <div className="ta-spinner" aria-hidden="true" />
        <strong>{label}</strong>
      </div>
    </div>
  );
}
