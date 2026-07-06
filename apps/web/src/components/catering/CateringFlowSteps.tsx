import type { ReactNode } from "react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { IconCheckCircle, IconClipboard, IconGrid, IconPackage, IconTruck } from "./CateringIcons";

export type FlowStep = "method" | "category" | "package" | "checkout" | "done";

interface Props {
  current: FlowStep;
  onNavigate?: (step: FlowStep) => void;
}

const STEPS: { id: FlowStep; labelKey: string; icon: ReactNode }[] = [
  { id: "method", labelKey: "catering.flow.method", icon: <IconTruck /> },
  { id: "category", labelKey: "catering.flow.category", icon: <IconGrid /> },
  { id: "package", labelKey: "catering.flow.package", icon: <IconPackage /> },
  { id: "checkout", labelKey: "catering.flow.checkout", icon: <IconClipboard /> },
  { id: "done", labelKey: "catering.flow.done", icon: <IconCheckCircle /> }
];

const ORDER: FlowStep[] = ["method", "category", "package", "checkout", "done"];

export function CateringFlowSteps({ current, onNavigate }: Props) {
  const { t } = useLanguage();
  const currentIndex = ORDER.indexOf(current);

  return (
    <nav className="catering-flow-steps" aria-label={t("catering.flow.label")}>
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === current;
        const clickable = Boolean(onNavigate) && index <= currentIndex && step.id !== "done";

        return (
          <button
            key={step.id}
            type="button"
            className={`catering-flow-step${active ? " is-active" : ""}${done ? " is-done" : ""}`}
            disabled={!clickable}
            onClick={() => onNavigate?.(step.id)}
          >
            <span className="catering-flow-step-icon" aria-hidden="true">
              {step.icon}
            </span>
            <span className="catering-flow-step-label">{t(step.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
