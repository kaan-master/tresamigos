import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  block?: boolean;
}

export function AdminButton({
  variant = "ghost",
  loading = false,
  loadingText,
  icon,
  block,
  className = "",
  children,
  disabled,
  ...props
}: Props) {
  const variantClass =
    variant === "primary" ? "ta-btn-primary" : variant === "danger" ? "ta-btn-danger" : "ta-btn-ghost";

  return (
    <button
      className={`ta-btn ${variantClass}${block ? " ta-btn-block" : ""}${loading ? " is-loading" : ""} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="ta-btn-spinner" aria-hidden="true" /> : icon ? <span className="ta-btn-icon-wrap">{icon}</span> : null}
      <span className="ta-btn-label">{loading ? loadingText || "Bezig..." : children}</span>
    </button>
  );
}
