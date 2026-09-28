import { AdminButton } from "./AdminButton";
import { IconSave } from "./AdminIcons";
import { useQuietSaveOptional } from "../context/QuietSaveContext";
import type { SiteContent } from "@tresamigos/types";

export interface PanelSaveProps {
  onSave: () => void | Promise<void>;
  onSaveQuiet?: (next?: SiteContent) => Promise<SiteContent | null>;
  saving?: boolean;
}

export function FormSaveBar({ onSave, onSaveQuiet, saving = false }: PanelSaveProps) {
  const quiet = useQuietSaveOptional();

  async function handleSave() {
    if (quiet) {
      quiet.markDirty(["*"]);
      await quiet.persist("manual");
      return;
    }
    if (onSaveQuiet) {
      await onSaveQuiet();
      return;
    }
    await onSave();
  }

  const busy = quiet?.saving ?? saving;
  const hint = quiet?.saveHint || "";

  return (
    <div className="ta-form-save">
      <AdminButton
        variant="primary"
        icon={<IconSave width={16} height={16} />}
        loading={busy}
        loadingText="Opslaan..."
        onClick={() => void handleSave()}
      >
        Opslaan
      </AdminButton>
      {hint ? <span className="ta-save-inline-hint">{hint}</span> : null}
      <span className="ta-seo-hint" style={{ margin: 0 }}>
        Wijzigingen worden automatisch opgeslagen bij verlaten van een veld.
      </span>
    </div>
  );
}
