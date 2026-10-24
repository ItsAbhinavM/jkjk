import type { ReactNode } from "react";
import { ACCENTS, type Accent } from "../../lib/accent";
import { cn } from "../../lib/cn";

const BADGE_TONES = {
  bad: "bg-red-100 text-red-700",
  good: "bg-emerald-100 text-emerald-700",
  info: "bg-blue-100 text-blue-700",
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
    <div className={cn("rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-900/5", ACCENTS[accent], className)}>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-semibold leading-none">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {badge && <span className={cn("mt-4 inline-block rounded-full px-3 py-1 text-sm font-medium", BADGE_TONES[badge.tone])}>{badge.label}</span>}
      {hint && <p className="mt-3 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}