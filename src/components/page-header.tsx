import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import {
  currentScenarioIdAtom,
  scenarioListAtom,
  scenarioNameAtom,
  scenarioStatusAtom,
} from "@/store/scenario-atoms";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  showScenarioBadge?: boolean;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 ring-gray-300",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-300",
  archived: "bg-amber-50 text-amber-700 ring-amber-300",
};

export function PageHeader({
  title,
  description,
  children,
  showScenarioBadge = false,
}: PageHeaderProps) {
  const currentScenarioId = useAtomValue(currentScenarioIdAtom);
  const scenarioList = useAtomValue(scenarioListAtom);
  const scenarioName = useAtomValue(scenarioNameAtom);
  const scenarioStatus = useAtomValue(scenarioStatusAtom);
  const hasActiveScenario = scenarioList.some(
    (scenario) => scenario.id === currentScenarioId,
  );
  const scenarioLabel =
    scenarioName && scenarioName.trim().length > 0 ? scenarioName : "Baseline";
  const statusClass =
    STATUS_BADGE_CLASS[scenarioStatus] ?? STATUS_BADGE_CLASS.draft;
  const isBaseline = currentScenarioId === "baseline";
  const shouldRenderRight = Boolean(showScenarioBadge || children);

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {shouldRenderRight && (
        <div className="flex items-center gap-2 shrink-0">
          {showScenarioBadge && hasActiveScenario && (
            <>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                Scenario: {scenarioLabel}
              </span>
              {isBaseline && (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Baseline
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClass}`}
              >
                {scenarioStatus}
              </span>
            </>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
