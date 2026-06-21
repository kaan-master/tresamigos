import { AdminButton } from "./AdminButton";
import { IconSave } from "./AdminIcons";

export interface PanelSaveProps {
  onSave: () => void | Promise<void>;
  saving?: boolean;
}

export function FormSaveBar({ onSave, saving = false }: PanelSaveProps) {
  return (
    <div className="ta-form-save">
      <AdminButton
        variant="primary"
        icon={<IconSave width={16} height={16} />}
        loading={saving}
        loadingText="Opslaan..."
        onClick={() => void onSave()}
      >
        Opslaan
      </AdminButton>
    </div>
  );
}
