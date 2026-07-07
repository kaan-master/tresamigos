import { AdminTabletFullscreen } from "./AdminTabletFullscreen";
import { AdminTabletSearch } from "./AdminTabletSearch";
import { AdminTabletToggle } from "./AdminTabletToggle";
import { useAdminTablet } from "../../context/AdminTabletContext";
import type { AdminSearchItem } from "../../lib/adminTabletSearch";

interface Props {
  title: string;
  showBack?: boolean;
  searchItems?: AdminSearchItem[];
  onSearchSelect?: (item: AdminSearchItem) => void;
}

export function AdminTabletBar({ title, showBack, searchItems, onSearchSelect }: Props) {
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
        <div className="ta-tablet-bar-tools">
          <AdminTabletFullscreen />
          <AdminTabletToggle />
        </div>
      </div>
      {searchItems && onSearchSelect ? (
        <AdminTabletSearch items={searchItems} onSelect={onSearchSelect} />
      ) : null}
    </div>
  );
}
