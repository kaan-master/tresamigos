import { IconMaximize, IconMinimize } from "../AdminIcons";
import { useAdminTablet } from "../../context/AdminTabletContext";

export function AdminTabletFullscreen() {
  const { isFullscreen, toggleFullscreen } = useAdminTablet();

  return (
    <button
      type="button"
      className={`ta-tablet-tool${isFullscreen ? " is-active" : ""}`}
      onClick={() => void toggleFullscreen()}
      aria-pressed={isFullscreen}
      aria-label={isFullscreen ? "Volledig scherm uit" : "Volledig scherm"}
      title={isFullscreen ? "Volledig scherm uit" : "Volledig scherm"}
    >
      {isFullscreen ? <IconMinimize width={16} height={16} /> : <IconMaximize width={16} height={16} />}
      <span>{isFullscreen ? "Klein" : "Volledig"}</span>
    </button>
  );
}
