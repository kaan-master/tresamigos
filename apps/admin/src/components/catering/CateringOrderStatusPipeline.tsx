import type { CateringOrderStatus } from "@tresamigos/types";
import { CATERING_ORDER_STATUSES } from "@tresamigos/types";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "../../lib/cateringAdmin";

const PIPELINE: { status: CateringOrderStatus; icon: string; label: string }[] = [
  { status: "nieuw", icon: "📥", label: "Nieuw" },
  { status: "bevestigd", icon: "✓", label: "Bevestigd" },
  { status: "voorbereid", icon: "👨‍🍳", label: "Voorbereid" },
  { status: "afgerond", icon: "🎉", label: "Afgerond" }
];

interface Props {
  current: CateringOrderStatus;
  onSelect?: (status: CateringOrderStatus) => void;
}

export function CateringOrderStatusPipeline({ current, onSelect }: Props) {
  const cancelled = current === "geannuleerd";
  const currentIndex = PIPELINE.findIndex((step) => step.status === current);

  if (cancelled) {
    return (
      <div className="catering-status-pipeline is-cancelled">
        <span className="catering-status-pipeline-cancelled">Geannuleerd</span>
      </div>
    );
  }

  return (
    <div className="catering-status-pipeline" role="list" aria-label="Orderstatus">
      {PIPELINE.map((step, index) => {
        const done = currentIndex > index;
        const active = current === step.status;
        return (
          <button
            key={step.status}
            type="button"
            role="listitem"
            className={`catering-status-step${done ? " is-done" : ""}${active ? " is-active" : ""}`}
            disabled={!onSelect || index > currentIndex + 1}
            onClick={() => onSelect?.(step.status)}
          >
            <span className="catering-status-step-icon" aria-hidden="true">
              {done ? "✓" : step.icon}
            </span>
            <span>{STATUS_LABELS[step.status]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function statusOptionsForFilter(incomingCount: number) {
  return [
    { value: "incoming", label: `Inkomend (${incomingCount})` },
    { value: "all", label: "Alle statussen" },
    ...CATERING_ORDER_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))
  ];
}
