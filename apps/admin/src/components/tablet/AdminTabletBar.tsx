import { AdminTabletToggle } from "./AdminTabletToggle";
import { useAdminTablet } from "../../context/AdminTabletContext";

interface Props {
  title: string;
  showBack?: boolean;
}

export function AdminTabletBar({ title, showBack }: Props) {
  const { goHub } = useAdminTablet();

  return (
    <div className="ta-tablet-bar">
      <div className="ta-tablet-bar-main">
        {showBack ? (
          <button type="button" className="ta-tablet-back" onClick={goHub}>
            Terug
          </button>
        ) : (
          <span className="ta-tablet-bar-spacer" aria-hidden="true" />
        )}
        <strong className="ta-tablet-bar-title">{title}</strong>
        <AdminTabletToggle />
      </div>
    </div>
  );
}
