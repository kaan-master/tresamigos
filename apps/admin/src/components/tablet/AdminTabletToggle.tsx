import { IconGrid } from "../AdminIcons";
import { useAdminTablet } from "../../context/AdminTabletContext";

export function AdminTabletToggle() {
  const { enabled, toggleEnabled } = useAdminTablet();

  return (
    <button
      type="button"
      className={`ta-tablet-toggle${enabled ? " is-active" : ""}`}
      onClick={toggleEnabled}
      aria-pressed={enabled}
      aria-label={enabled ? "Tabletmodus uit" : "Tabletmodus aan"}
    >
      <IconGrid width={16} height={16} />
      <span>{enabled ? "Tabletmodus" : "iPad-modus"}</span>
    </button>
  );
}
