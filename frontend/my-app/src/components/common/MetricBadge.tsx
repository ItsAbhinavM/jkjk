import type { ReactNode } from "react";
import { ACCENTS, type Accent } from "../../lib/accent";
import { cn } from "../../lib/cn";

const BADGE_TONES = {
  bad: "border-red-400/50 bg-red-500/15 text-red-300",
  good: "border-emerald-400/50 bg-emerald-500/15 text-emerald-300",
  info: "border-blue-400/50 bg-blue-500/15 text-blue-300",
};

interface MetricBadgeProps {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  accent?: Accent;
  badge?: { label: string; tone: keyof typeof BADGE_TONES };
  className?: string;
}

/** A KPI tile: a label, one large number and a plain-language explanation. */
export default function MetricBadge({ label, value, unit, hint, accent = "none", badge, className }: MetricBadgeProps) {
  return (
    <div className={cn("border border-slate-600 bg-slate-800 p-4", ACCENTS[accent], className)}>
      <div className="text-sm font-medium text-slate-300">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-semibold leading-none">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {badge && (
        <span className={cn("mt-3 inline-block border px-2 py-0.5 text-sm font-medium", BADGE_TONES[badge.tone])}>
          {badge.label}
        </span>
      )}
      {hint && <p className="mt-2 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}