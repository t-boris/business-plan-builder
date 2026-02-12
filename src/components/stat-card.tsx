import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  sublabel?: string;
  className?: string;
}

const trendConfig = {
  up: { icon: ArrowUp, color: "text-emerald-500" },
  down: { icon: ArrowDown, color: "text-red-500" },
  neutral: { icon: Minus, color: "text-muted-foreground" },
} as const;

export function StatCard({
  label,
  value,
  trend,
  sublabel,
  className,
}: StatCardProps) {
  const trendInfo = trend ? trendConfig[trend] : null;

  return (
    <div className={cn("card-elevated rounded-lg p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        {trendInfo && (
          <trendInfo.icon className={cn("size-3.5", trendInfo.color)} />
        )}
      </div>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
      )}
    </div>
  );
}
